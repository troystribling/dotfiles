/* @flow */

const Config = {
  getJson(key: string, _default: Object = {}) {
    const value = atom.config.get(`Hydrogen.${key}`);
    if (!value || typeof value !== "string") return _default;
    try {
      return JSON.parse(value);
    } catch (error) {
      const message = `Your Hydrogen config is broken: ${key}`;
      atom.notifications.addError(message, { detail: error });
    }
    return _default;
  },

  schema: {
    autocomplete: {
      title: "Enable Autocomplete",
      includeTitle: false,
      description:
        "If enabled, use autocomplete options provided by the current kernel.",
      type: "boolean",
      default: true,
      order: 0
    },
    showAutocompleteFirst: {
      title: "Show Hydrogen's autocomplete suggestions first",
      includeTitle: false,
      description:
        "If enabled, Hydrogen's autocomplete suggestions will be listed before those of other providers, like snippets.",
      type: "boolean",
      default: true,
      order: 1
    },
    importNotebookURI: {
      title: "Enable Notebook Auto-import",
      description:
        "If enabled, opening a file with extension `.ipynb` will [import the notebook](https://nteract.gitbooks.io/hydrogen/docs/Usage/NotebookFiles.html#notebook-import) file's source into a new tab. If disabled, or if the Hydrogen package is not activated, the raw file will open in Atom as normal.",
      type: "boolean",
      default: true,
      order: 1.5
    },
    statusBarDisable: {
      title: "Disable the Hydrogen status bar",
      description:
        "If enabled, no kernel information will be provided in Atom's status bar.",
      type: "boolean",
      default: false,
      order: 2
    },
    debug: {
      title: "Enable Debug Messages",
      includeTitle: false,
      description: "If enabled, log debug messages onto the dev console.",
      type: "boolean",
      default: false,
      order: 3
    },
    autoScroll: {
      title: "Enable Autoscroll",
      includeTitle: false,
      description:
        "If enabled, Hydrogen will automatically scroll to the bottom of the result view.",
      type: "boolean",
      default: true,
      order: 4
    },
    wrapOutput: {
      title: "Enable Soft Wrap for Output",
      includeTitle: false,
      description:
        "If enabled, your output code from Hydrogen will break long text and items.",
      type: "boolean",
      default: false,
      order: 4.5
    },
    outputAreaDefault: {
      title: "View output in the dock by default",
      description:
        "If enabled, output will be displayed in the dock by default rather than inline",
      type: "boolean",
      default: false,
      order: 5
    },
    outputAreaDock: {
      title: "Leave output dock open",
      description:
        "Do not close dock when switching to an editor without a running kernel",
      type: "boolean",
      default: false,
      order: 6
    },
    outputAreaFontSize: {
      title: "Output area fontsize",
      includeTitle: false,
      description: "Change the fontsize of the Output area.",
      type: "integer",
      minimum: 0,
      default: 0,
      order: 7
    },
    globalMode: {
      title: "Enable Global Kernel",
      description:
        "If enabled, all files of the same grammar will share a single global kernel (requires Atom restart)",
      type: "boolean",
      default: false,
      order: 8
    },
    kernelNotifications: {
      title: "Enable Kernel Notifications",
      includeTitle: false,
      description:
        "Notify if kernels writes to stdout. By default, kernel notifications are only displayed in the developer console.",
      type: "boolean",
      default: false,
      order: 9
    },
    startDir: {
      title: "Directory to start kernel in",
      includeTitle: false,
      description: "Restart the kernel for changes to take effect.",
      type: "string",
      enum: [
        {
          value: "firstProjectDir",
          description: "The first started project's directory (default)"
        },
        {
          value: "projectDirOfFile",
          description: "The project directory relative to the file"
        },
        {
          value: "dirOfFile",
          description: "Current directory of the file"
        }
      ],
      default: "firstProjectDir",
      order: 10
    },
    languageMappings: {
      title: "Language Mappings",
      includeTitle: false,
      description:
        'Custom Atom grammars and some kernels use non-standard language names. That leaves Hydrogen unable to figure out what kernel to start for your code. This field should be a valid JSON mapping from a kernel language name to Atom\'s grammar name ``` { "kernel name": "grammar name" } ```. For example ``` { "scala211": "scala", "javascript": "babel es6 javascript", "python": "magicpython" } ```.',
      type: "string",
      default: '{ "python": "magicpython" }',
      order: 11
    },
    startupCode: {
      title: "Startup Code",
      includeTitle: false,
      description:
        'This code will be executed on kernel startup. Format: `{"kernel": "your code \\nmore code"}`. Example: `{"Python 2": "%matplotlib inline"}`',
      type: "string",
      default: "{}",
      order: 12
    },
    gateways: {
      title: "Kernel Gateways",
      includeTitle: false,
      description:
        'Hydrogen can connect to remote notebook servers and kernel gateways. Each gateway needs at minimum a name and a value for options.baseUrl. The options are passed directly to the `jupyter-js-services` npm package, which includes documentation for additional fields. Example value: ``` [{ "name": "Remote notebook", "options": { "baseUrl": "http://mysite.com:8888" } }] ```',
      type: "string",
      default: "[]",
      order: 13
    }
  }
};

export default Config;
