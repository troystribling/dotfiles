'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.__TEST__ = undefined;

var _path = _interopRequireDefault(require('path'));

var _url = _interopRequireDefault(require('url'));

var _os = _interopRequireDefault(require('os'));

var _string;

function _load_string() {
  return _string = require('./string');
}

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// eslint-disable-next-line rulesdir/prefer-nuclide-uri
const ARCHIVE_SEPARATOR = '!'; /**
                                * Copyright (c) 2017-present, Facebook, Inc.
                                * All rights reserved.
                                *
                                * This source code is licensed under the BSD-style license found in the
                                * LICENSE file in the root directory of this source tree. An additional grant
                                * of patent rights can be found in the PATENTS file in the same directory.
                                *
                                * 
                                * @format
                                */

// NuclideUri's are either a local file path, or a URI
// of the form nuclide://<host><path>
//
// This package creates, queries and decomposes NuclideUris.

const KNOWN_ARCHIVE_EXTENSIONS = ['.jar', '.zip'];

const REMOTE_PATH_URI_PREFIX = 'nuclide://';
// TODO(ljw): following regex is incorrect. A URI scheme must start with
// [A-Za-z] not [0-9_-]. Also, not all schemes require // after them.
const URI_PREFIX_REGEX = /^[A-Za-z0-9_-]+:\/\/.*/;

function isRemote(uri) {
  return uri.startsWith(REMOTE_PATH_URI_PREFIX);
}

// When restoring Atom state on load, Atom mangles our remote URIs by
// removing one of the '/'s. These TextBuffers/TextEditors live for a short time
// and are destroyed during Nuclide startup.
// On Windows, we further mangle the colon into an underscore to avoid an invalid drive prefix.
function isBrokenDeserializedUri(uri) {
  return uri != null && uri.match(/nuclide[:_][\\/][^/]/) != null;
}

// Atom often puts its URIs in places where we'd expect to see Nuclide URIs (or plain paths)
function isAtomUri(uri) {
  return uri.startsWith('atom://');
}

function isUri(uri) {
  return URI_PREFIX_REGEX.test(uri);
}

function isLocal(uri) {
  return !isRemote(uri) && !isUri(uri) && !isAtomUri(uri);
}

function createRemoteUri(hostname, remotePath) {
  if (!(remotePath != null && remotePath !== '')) {
    throw new Error('NuclideUri must include a path.');
  }

  return `nuclide://${hostname}${remotePath}`;
}

function isInArchive(uri) {
  if (isAtomUri(uri) || uri.indexOf(ARCHIVE_SEPARATOR) < 0) {
    return false;
  }
  for (let i = uri.indexOf(ARCHIVE_SEPARATOR); i >= 0; i = uri.indexOf(ARCHIVE_SEPARATOR, i + 1)) {
    if (_isArchiveSeparator(uri, i)) {
      return true;
    }
  }
  return false;
}

function ancestorOutsideArchive(uri) {
  for (let i = uri.indexOf(ARCHIVE_SEPARATOR); i >= 0; i = uri.indexOf(ARCHIVE_SEPARATOR, i + 1)) {
    if (_isArchiveSeparator(uri, i)) {
      return uri.substring(0, i);
    }
  }
  return uri;
}

/**
 * Parses valid Nuclide URIs into the hostname and path components.
 * Throws an Error on invalid URIs. Invalid URIs are:
 *  1) Any URI that does not start with 'nuclide://' protocol.
 *  2) A URI starting with 'nuclide://' that doesn't contain either a hostname or a path
 *
 * Everything that does not contain a '://' is assumed to be a local path. Both POSIX and Windows
 * paths are legal
 */
function parse(uri) {
  if (uri.startsWith(REMOTE_PATH_URI_PREFIX)) {
    const hostAndPath = uri.substr(REMOTE_PATH_URI_PREFIX.length);
    const hostSep = hostAndPath.indexOf('/');

    if (!(hostSep !== -1)) {
      throw new Error(`Remote URIs must contain a hostname and a path. Failed to parse ${uri}`);
    }

    const hostname = hostAndPath.substr(0, hostSep);

    if (!(hostname !== '')) {
      throw new Error(`Remote URIs must contain a hostname. Failed to parse ${uri}`);
    }

    const path = hostAndPath.substr(hostSep);

    if (!!_endsWithArchiveSeparator(uri)) {
      throw new Error(`Path cannot end with archive separator. Failed to parse ${uri}`);
    }

    return { hostname, path };
  }

  if (!(uri.indexOf('://') === -1)) {
    throw new Error('Nuclide URI must be either local file names or URLs starting with nuclide://');
  }

  if (!!_endsWithArchiveSeparator(uri)) {
    throw new Error(`Path cannot end with archive separator. Failed to parse ${uri}`);
  }

  return { hostname: null, path: uri };
}

function parseRemoteUri(remoteUri) {
  if (!isRemote(remoteUri)) {
    throw new Error('Expected remote uri. Got ' + remoteUri);
  }
  const parsedUri = parse(remoteUri);

  if (!
  // flowlint-next-line sketchy-null-string:off
  parsedUri.hostname) {
    throw new Error(`Remote Nuclide URIs must contain hostnames, '${(0, (_string || _load_string()).maybeToString)(parsedUri.hostname)}' found while parsing '${remoteUri}'`);
  }

  // Explicitly copying object properties appeases Flow's "maybe" type handling. Using the `...`
  // operator causes null/undefined errors, and `Object.assign` bypasses type checking.


  return {
    hostname: parsedUri.hostname,
    path: parsedUri.path
  };
}

function getPath(uri) {
  return parse(uri).path;
}

function getHostname(remoteUri) {
  return parseRemoteUri(remoteUri).hostname;
}

function getHostnameOpt(remoteUri) {
  if (remoteUri == null || !isRemote(remoteUri)) {
    return null;
  }

  return getHostname(remoteUri);
}

function join(uri, ...relativePath) {
  _testForIllegalUri(uri);
  const uriPathModule = _pathModuleFor(uri);
  if (isRemote(uri)) {
    const { hostname, path } = parseRemoteUri(uri);
    relativePath.splice(0, 0, path);
    _archiveEncodeArrayInPlace(uriPathModule, relativePath);
    return _archiveDecode(uriPathModule, createRemoteUri(hostname, uriPathModule.join.apply(null, relativePath)));
  } else {
    relativePath.splice(0, 0, uri);
    _archiveEncodeArrayInPlace(uriPathModule, relativePath);
    return _archiveDecode(uriPathModule, uriPathModule.join.apply(null, relativePath));
  }
}

function archiveJoin(uri, path) {
  _testForIllegalUri(uri);
  if (!KNOWN_ARCHIVE_EXTENSIONS.some(ext => uri.endsWith(ext))) {
    throw new Error(`Cannot archiveJoin with non-archive ${uri} and ${path}`);
  }
  return uri + ARCHIVE_SEPARATOR + path;
}

function normalize(uri) {
  _testForIllegalUri(uri);
  const uriPathModule = _pathModuleFor(uri);
  if (isRemote(uri)) {
    const { hostname, path } = parseRemoteUri(uri);
    const normal = _archiveDecode(uriPathModule, uriPathModule.normalize(_archiveEncode(uriPathModule, path)));
    return createRemoteUri(hostname, normal);
  } else {
    return _archiveDecode(uriPathModule, uriPathModule.normalize(_archiveEncode(uriPathModule, uri)));
  }
}

function normalizeDir(uri) {
  return ensureTrailingSeparator(normalize(uri));
}

function getParent(uri) {
  // TODO: Is this different than dirname?
  return normalize(join(uri, '..'));
}

function relative(uri, other) {
  _testForIllegalUri(uri);
  const uriPathModule = _pathModuleFor(uri);
  const remote = isRemote(uri);
  if (remote !== isRemote(other) || remote && getHostname(uri) !== getHostname(other)) {
    throw new Error(`Cannot relative urls on different hosts: ${uri} and ${other}`);
  }
  const uriEncode = _archiveEncode(uriPathModule, remote ? getPath(uri) : uri);
  const otherEncode = _archiveEncode(uriPathModule, remote ? getPath(other) : other);
  return _archiveDecode(uriPathModule, uriPathModule.relative(_matchTrailingArchive(uriEncode, otherEncode), _matchTrailingArchive(otherEncode, uriEncode)));
}

function basename(uri, ext = '') {
  _testForIllegalUri(uri);
  const uriPathModule = _pathModuleFor(uri);
  return _archiveDecode(uriPathModule, uriPathModule.basename(_archiveEncode(uriPathModule, getPath(uri)), ext));
}

function dirname(uri) {
  _testForIllegalUri(uri);
  const uriPathModule = _pathModuleFor(uri);
  if (isRemote(uri)) {
    const { hostname, path } = parseRemoteUri(uri);
    return createRemoteUri(hostname, _archiveDecode(uriPathModule, uriPathModule.dirname(_archiveEncode(uriPathModule, path))));
  } else {
    return _archiveDecode(uriPathModule, uriPathModule.dirname(_archiveEncode(uriPathModule, uri)));
  }
}

function extname(uri) {
  _testForIllegalUri(uri);
  const uriPathModule = _pathModuleFor(uri);
  return _archiveDecode(uriPathModule, uriPathModule.extname(_archiveEncode(uriPathModule, getPath(uri))));
}

function stripExtension(uri) {
  _testForIllegalUri(uri);
  const ext = extname(uri);
  if (ext.length === 0) {
    return uri;
  }

  return uri.slice(0, -1 * ext.length);
}

function _isWindowsPath(path) {
  return _pathModuleFor(path) === _path.default.win32;
}

function _getWindowsPathFromWindowsFileUri(uri) {
  const prefix = 'file://';
  if (!uri.startsWith(prefix)) {
    return null;
  }

  const path = uri.substr(prefix.length);
  return _isWindowsPath(path) ? path : null;
}

/**
 * uri is either a file: uri, or a nuclide: uri.
 * must convert file: uri's to just a path for atom.
 *
 * Returns null if not a valid file: URI.
 */
function uriToNuclideUri(uri) {
  // TODO(ljw): the following check is incorrect. It's designed to support
  // two-slash file URLs of the form "file://c:\path". But those are invalid
  // file URLs, and indeed it fails to %-escape "file://c:\My%20Documents".
  const windowsPathFromUri = _getWindowsPathFromWindowsFileUri(uri);
  // flowlint-next-line sketchy-null-string:off
  if (windowsPathFromUri) {
    // If the specified URI is a local file:// URI to a Windows path,
    // handle specially first. url.parse() gets confused by the "X:"
    // part of the Windows path and thinks the X is the name of a remote
    // host.
    return windowsPathFromUri;
  }

  const urlParts = _url.default.parse(_escapeSpecialCharacters(uri), false);
  // flowlint-next-line sketchy-null-string:off
  if (urlParts.protocol === 'file:' && urlParts.path) {
    // only handle real files for now.
    return urlParts.path;
  } else if (isRemote(uri)) {
    return uri;
  } else {
    return null;
  }
}

/**
 * Converts local paths to file: URI's. Leaves remote URI's alone.
 */
function nuclideUriToUri(uri) {
  _testForIllegalUri(uri);
  if (isRemote(uri)) {
    return uri;
  } else {
    return 'file://' + uri;
  }
}

/**
 * Returns true if child is equal to, or is a proper child of parent.
 */
function contains(parent, child) {
  _testForIllegalUri(parent);
  _testForIllegalUri(child);

  // Can't just do startsWith here. If this directory is "www" and you
  // are trying to check "www-base", just using startsWith would return
  // true, even though "www-base" is at the same level as "Www", not
  // contained in it.
  // Also, there's an issue with a trailing separator ambiguity. A path
  // like /abc/ does contain /abc
  // This function is used in some performance-sensitive parts, so we
  // want to avoid doing unnecessary string copy, as those that would
  // result from an ensureTrailingSeparator() call
  //
  // First we'll check the lengths.
  // Then check startsWith. If so, then if the two path lengths are
  // equal OR if the next character in the path to check is a path
  // separator, then we know the checked path is in this path.

  if (child.length < parent.length) {
    // A strong indication of false
    // It could be a matter of a trailing separator, though
    if (child.length < parent.length - 1) {
      // It must be more than just the separator
      return false;
    }

    return parent.startsWith(child) && (endsWithSeparator(parent) || _isArchiveSeparator(child, parent.length));
  }

  if (!child.startsWith(parent)) {
    return false;
  }

  if (endsWithSeparator(parent) || parent.length === child.length) {
    return true;
  }

  const uriPathModule = _pathModuleFor(child);

  return _isArchiveSeparator(child, parent.length) || child.slice(parent.length).startsWith(uriPathModule.sep);
}

/**
 * Filter an array of paths to contain only the collapsed root paths, e.g.
 * [a/b/c, a/, c/d/, c/d/e] collapses to [a/, c/d/]
 */
function collapse(paths) {
  return paths.filter(p => !paths.some(fp => contains(fp, p) && fp !== p));
}

const hostFormatters = [];

// A formatter which may shorten hostnames.
// Returns null if the formatter won't shorten the hostname.


// Registers a host formatter for nuclideUriToDisplayString
function registerHostnameFormatter(formatter) {
  hostFormatters.push(formatter);
  return {
    dispose: () => {
      const index = hostFormatters.indexOf(formatter);
      if (index >= 0) {
        hostFormatters.splice(index, 1);
      }
    }
  };
}

/**
 * NuclideUris should never be shown to humans.
 * This function returns a human usable string.
 */
function nuclideUriToDisplayString(uri) {
  _testForIllegalUri(uri);
  if (isRemote(uri)) {
    let hostname = getHostname(uri);
    for (const formatter of hostFormatters) {
      const formattedHostname = formatter(hostname);
      // flowlint-next-line sketchy-null-string:off
      if (formattedHostname) {
        hostname = formattedHostname;
        break;
      }
    }
    return `${hostname}:${getPath(uri)}`;
  } else {
    return uri;
  }
}

function ensureTrailingSeparator(uri) {
  _testForIllegalUri(uri);
  const uriPathModule = _pathModuleFor(uri);
  if (uri.endsWith(uriPathModule.sep)) {
    return uri;
  }

  return uri + uriPathModule.sep;
}

function trimTrailingSeparator(uri) {
  _testForIllegalUri(uri);
  const uriPathModule = _pathModuleFor(uri);
  let stripped = uri;

  while (stripped.endsWith(uriPathModule.sep) && !isRoot(stripped)) {
    stripped = stripped.slice(0, -1 * uriPathModule.sep.length);
  }

  return stripped;
}

function endsWithSeparator(uri) {
  _testForIllegalUri(uri);
  const uriPathModule = _pathModuleFor(uri);
  return uri.endsWith(uriPathModule.sep);
}

function isAbsolute(uri) {
  _testForIllegalUri(uri);
  if (isRemote(uri)) {
    return true;
  } else {
    const uriPathModule = _pathModuleFor(uri);
    return uriPathModule.isAbsolute(uri);
  }
}

function resolve(uri, ...paths) {
  _testForIllegalUri(uri);
  const uriPathModule = _pathModuleFor(uri);
  if (isRemote(uri)) {
    const { hostname, path } = parseRemoteUri(uri);
    paths.splice(0, 0, path);
    _archiveEncodeArrayInPlace(uriPathModule, paths);
    return createRemoteUri(hostname, _archiveDecode(uriPathModule, uriPathModule.resolve.apply(null, paths)));
  } else {
    paths.splice(0, 0, uri);
    _archiveEncodeArrayInPlace(uriPathModule, paths);
    return _archiveDecode(uriPathModule, uriPathModule.resolve.apply(null, paths));
  }
}

function expandHomeDir(uri) {
  _testForIllegalUri(uri);

  // Do not expand non home relative uris
  if (!uri.startsWith('~')) {
    return uri;
  }

  // "home" on Windows is %UserProfile%. Note that Windows environment variables
  // are NOT case sensitive, but process.env is a magic object that wraps GetEnvironmentVariableW
  // on Windows, so asking for any case is expected to work.
  const { HOME, UserProfile } = process.env;

  const isWindows = !isRemote(uri) && _os.default.platform() === 'win32';
  const homePath = isWindows ? UserProfile : HOME;

  if (!(homePath != null)) {
    throw new Error('Invariant violation: "homePath != null"');
  }

  if (uri === '~') {
    return homePath;
  }

  // Uris like ~abc should not be expanded
  if (!uri.startsWith('~/') && (!isWindows || !uri.startsWith('~\\'))) {
    return uri;
  }

  return _path.default.resolve(homePath, uri.replace('~', '.'));
}

/**
 * Splits a string containing local paths by an OS-specific path delimiter
 * Useful for splitting env variables such as PATH
 *
 * Since remote URI might contain the delimiter, only local paths are allowed.
 */
function splitPathList(paths) {
  if (!(paths.indexOf(REMOTE_PATH_URI_PREFIX) < 0)) {
    throw new Error('Splitting remote URIs is not supported');
  }

  const uriPathModule = _pathModuleFor(paths);

  return paths.split(uriPathModule.delimiter);
}

/**
 * Joins an array of local paths with an OS-specific path delimiter into a single string.
 * Useful for constructing env variables such as PATH
 *
 * Since remote URI might contain the delimiter, only local paths are allowed.
 */
function joinPathList(paths) {
  if (paths.length === 0) {
    return '';
  }

  if (!paths.every(path => !isRemote(path))) {
    throw new Error('Joining of remote URIs is not supported');
  }

  const uriPathModule = _pathModuleFor(paths[0]);
  return paths.join(uriPathModule.delimiter);
}

/**
 * This function prepends the given relative path with a "current-folder" prefix
 * which is `./` on *nix and .\ on Windows
 */
function ensureLocalPrefix(uri) {
  _testForIllegalUri(uri);
  const uriPathModule = _pathModuleFor(uri);

  if (!!isRemote(uri)) {
    throw new Error('Local prefix can not be added to a remote path');
  }

  if (!!isAbsolute(uri)) {
    throw new Error('Local prefix can not be added to an absolute path');
  }

  const localPrefix = `.${uriPathModule.sep}`;
  if (uri.startsWith(localPrefix)) {
    return uri;
  }

  return localPrefix + uri;
}

function isRoot(uri) {
  _testForIllegalUri(uri);
  return dirname(uri) === uri;
}

function parsePath(uri) {
  _testForIllegalUri(uri);
  const uriPathModule = _pathModuleFor(uri);
  if (!isInArchive(uri)) {
    return uriPathModule.parse(getPath(uri));
  } else {
    const parsed = uriPathModule.parse(_archiveEncode(uriPathModule, getPath(uri)));
    return {
      root: _archiveDecode(uriPathModule, parsed.root),
      dir: _archiveDecode(uriPathModule, parsed.dir),
      base: _archiveDecode(uriPathModule, parsed.base),
      ext: _archiveDecode(uriPathModule, parsed.ext),
      name: _archiveDecode(uriPathModule, parsed.name)
    };
  }
}

function pathSeparatorFor(uri) {
  return _pathModuleFor(uri).sep;
}

function split(uri) {
  const parts = [];
  let current = uri;
  let parent = dirname(current);

  while (current !== parent) {
    parts.push(basename(current));

    current = parent;
    parent = dirname(current);
  }

  if (isAbsolute(uri)) {
    parts.push(parent);
  }
  parts.reverse();
  return parts;
}

function hasKnownArchiveExtension(uri) {
  return KNOWN_ARCHIVE_EXTENSIONS.some(ext => uri.endsWith(ext));
}

function _pathModuleFor(uri) {
  if (!!_endsWithArchiveSeparator(uri)) {
    throw new Error(`Path cannot end with archive separator. Failed to determine path module for ${uri}`);
  }

  if (uri.startsWith(_path.default.posix.sep)) {
    return _path.default.posix;
  }
  if (uri.indexOf('://') > -1) {
    return _path.default.posix;
  }
  if (uri[1] === ':' && uri[2] === _path.default.win32.sep) {
    return _path.default.win32;
  }

  if (uri.split(_path.default.win32.sep).length > uri.split(_path.default.posix.sep).length) {
    return _path.default.win32;
  } else {
    return _path.default.posix;
  }
}

// Runs _archiveEncode in-place on array, and returns argument for convenience.
function _archiveEncodeArrayInPlace(uriPathModule, array) {
  array.forEach((uri, i, a) => a[i] = _archiveEncode(uriPathModule, uri));
  return array;
}

// This adds a native separator after every archive separator
// so that the native path handling code sees them.
function _archiveEncode(uriPathModule, uri) {
  if (uri.indexOf(ARCHIVE_SEPARATOR) < 0) {
    return uri;
  }
  return KNOWN_ARCHIVE_EXTENSIONS.reduce((acc, ext) => acc.replace(`${ext}${ARCHIVE_SEPARATOR}`, `${ext}${ARCHIVE_SEPARATOR}${uriPathModule.sep}`), uri);
}

// This is the inverse of `encodeArchiveSeparators()` to put things
// back after the native path handler has run.
function _archiveDecode(uriPathModule, uri) {
  if (uri.indexOf(ARCHIVE_SEPARATOR) < 0) {
    return uri;
  }
  return _trimArchiveSuffix(KNOWN_ARCHIVE_EXTENSIONS.reduce((acc, ext) => acc.replace(`${ext}${ARCHIVE_SEPARATOR}${uriPathModule.sep}`, `${ext}${ARCHIVE_SEPARATOR}`), uri));
}

// When working with encoded uri's, the archive separator is part of the name
// so we can manipulate paths with uriPathModule.  However, in `relative` if
// one uri contains the other, we need the names seen by uriPathModule to agree
// on whether there is an archive separator or not.  E.g. if we have:
//    /etc/file.zip
//    /etc/file.zip!abc
// When we encode these, we get:
//    /etc/file.zip
//    /etc/file.zip!/abc
// We need to add a trailing '!' to the first one so uriPathModule can see that
// the first contains the second.
function _matchTrailingArchive(uri, other) {
  if (uri.length < other.length && other.startsWith(uri) && _isArchiveSeparator(other, uri.length)) {
    return uri + ARCHIVE_SEPARATOR;
  } else {
    return uri;
  }
}

function _trimArchiveSuffix(path) {
  if (_endsWithArchiveSeparator(path)) {
    return path.substring(0, path.length - ARCHIVE_SEPARATOR.length);
  } else {
    return path;
  }
}

function _endsWithArchiveSeparator(path) {
  return _isArchiveSeparator(path, path.length - 1);
}

function _isArchiveSeparator(path, index) {
  return path.length > index && path.charAt(index) === ARCHIVE_SEPARATOR && KNOWN_ARCHIVE_EXTENSIONS.some(ext => {
    const extStart = index - ext.length;
    return path.indexOf(ext, extStart) === extStart;
  });
}

/**
 * The backslash and percent characters (\ %) are, unfortunately, valid symbols to be used in POSIX
 * paths. They, however, are being automatically "corrected" by node's `url.parse()` method if not
 * escaped properly.
 */
function _escapeSpecialCharacters(uri) {
  return uri.replace(/%/g, '%25').replace(/\\/g, '%5C');
}

function _testForIllegalUri(uri) {
  if (uri != null) {
    if (isAtomUri(uri)) {
      throw new Error(`Path operation invoked on Atom URI ${uri}`);
    }
    if (_endsWithArchiveSeparator(uri)) {
      throw new Error(`Path operation invoked on URI ending with ${ARCHIVE_SEPARATOR}: ${uri}`);
    }
  }
}

const NUCLIDE_URI_TYPE_NAME = 'NuclideUri';

// If mustBeRemote is present then remote-ness must match, otherwise remote-ness
// is ignored.
function validate(uri, mustBeRemote) {
  // Be a little extra paranoid to catch places where the type system may be weak.
  if (!(uri != null)) {
    throw new Error('Unexpected null NuclideUri');
  }

  if (!(typeof uri === 'string')) {
    throw new Error(`Unexpected NuclideUri type: ${String(uri)}`);
  }

  if (isRemote(uri)) {
    parse(uri);

    if (!(mustBeRemote !== false)) {
      throw new Error('Expected remote NuclideUri');
    }
  } else {
    if (!(uri !== '')) {
      throw new Error('NuclideUri must contain a non-empty path');
    }

    if (!(mustBeRemote !== true)) {
      throw new Error('Expected local NuclideUri');
    }
  }
}

exports.default = {
  basename,
  dirname,
  extname,
  stripExtension,
  isRemote,
  isBrokenDeserializedUri,
  isLocal,
  createRemoteUri,
  isInArchive,
  ancestorOutsideArchive,
  parse,
  parseRemoteUri,
  validate,
  getPath,
  getHostname,
  getHostnameOpt,
  join,
  archiveJoin,
  relative,
  normalize,
  normalizeDir,
  getParent,
  uriToNuclideUri,
  nuclideUriToUri,
  contains,
  collapse,
  nuclideUriToDisplayString,
  registerHostnameFormatter,
  ensureTrailingSeparator,
  trimTrailingSeparator,
  endsWithSeparator,
  isAbsolute,
  resolve,
  expandHomeDir,
  splitPathList,
  joinPathList,
  ensureLocalPrefix,
  isRoot,
  parsePath,
  split,
  pathSeparatorFor,
  hasKnownArchiveExtension,
  ARCHIVE_SEPARATOR,
  KNOWN_ARCHIVE_EXTENSIONS,
  NUCLIDE_URI_TYPE_NAME
};
const __TEST__ = exports.__TEST__ = {
  _pathModuleFor
};