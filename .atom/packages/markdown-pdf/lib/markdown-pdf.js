/** @babel */
let fs;
let fallback;
let less;
let mdpdf;
let path;
let tmp;
let util;

function loadDeps() {
  fs = require('fs');
  fallback = require('./fallback');
  less = require('less');
  mdpdf = require('mdpdf');
  path = require('path');
  tmp = require('tmp');
  util = require('./util');
}

module.exports = {
  config: {
    'format': {
      'title': 'Page Format',
      'type': 'string',
      'default': 'A4',
      'enum': ['A3', 'A4', 'A5', 'Legal', 'Letter', 'Tabloid']
    },
    'border': {
      'title': 'Border Size',
      'type': 'string',
      'default': '20mm'
    }
  },

  activate: function() {
    loadDeps();
    atom.commands.add('atom-workspace', 'markdown-pdf:convert', this.convert);
  },

  convert: async function() {
    try{
      const conf = atom.config.get('markdown-pdf');
      const activeEditor = atom.workspace.getActiveTextEditor();
      const inPath = activeEditor.getPath();
      const outPath = util.getOutputPath(inPath);
      const options = {
        source: inPath,
        destination: outPath,
        ghStyle: true,
        defaultStyle: true,
        pdf: {
          format: conf.format,
          quality: 100,
          header: {
            height: null
          },
          footer: {
            height: null
          },
          border: {
            top: conf.border,
            left: conf.border,
            bottom: conf.border,
            right: conf.border
          }
        }
      };
      let sheetPath = atom.styles.getUserStyleSheetPath();
      const pathObj = path.parse(sheetPath);
      if(pathObj.ext === '.less') {
        const cssPath = path.join(pathObj.dir, pathObj.name + '.css');
        const lessData = fs.readFileSync(sheetPath, 'utf8');
        sheetPath = tmp.tmpNameSync();
        const rendered = await less.render(lessData);
        fs.writeFileSync(sheetPath, rendered.css, 'utf8');
      }
      options.styles = sheetPath;
      atom.notifications.addInfo('Converting to PDF...', {icon: 'markdown'});
      await mdpdf.convert(options);
      atom.notifications.addSuccess(
        'Converted successfully.',
        { detail: 'Output in ' + outPath, icon: 'file-pdf' }
      );
    } catch(err) {
      try {
        console.log(err.stack);
        atom.notifications.addWarning('Attempting conversion with fallback');
        fallback.convert();
      } catch(err) {
        const remote = require('remote');
        atom.notifications.addError(
          'Markdown-pdf: Error. Check console for more information.',
          {
            buttons: [{
              className: 'md-pdf-err',
              onDidClick: () => remote.getCurrentWindow().openDevTools(),
              text: 'Open console',
            }]
          }
        )
        console.log(err.stack);
        return;
      }
    }
  }
}
