module.exports =
  config:
    configurationPath:
      type: 'string'
      description: 'SwiftLint\'s configuration file that relative to project or absolute'
      default: '.swiftlint.yml'
    additionalOptions:
      type: 'string'
      description: 'SwiftLint\'s `lint` command options other than `--config` and `--use-stdin`'
      default: ''
    swiftlintExecutablePath:
      type: 'string'
      title: 'The Path to SwiftLint'
      default: '/usr/local/bin/swiftlint'

  activate: ->
    require('atom-package-deps').install('linter-swiftlint')

  provideLinter: ->
    helpers = require('atom-linter')
    path = require('path')
    fs = require('fs-plus')
    regex = '([^:]+):(?<line>\\d+):(?<col>\\d+)?:?\\s(?<type>\\w+):\\s(?<message>.*)'
    provider =
      grammarScopes: ['source.swift']
      scope: 'file'
      lintOnFly: true
      lint: (textEditor) ->
        filePath = textEditor.getPath()
        input = textEditor.getText()

        command = atom.config.get('linter-swiftlint.swiftlintExecutablePath')
        return unless fs.existsSync(command)
        parameters = ['lint', '--use-stdin']
        config = fs.normalize(atom.config.get('linter-swiftlint.configurationPath'))
        if not path.isAbsolute(config)
          config = atom.project.getDirectories()
            .filter (directory) -> directory.contains filePath
            .map (direcotory) -> direcotory.getFile(config).getPath()
            .find -> true # take first item if exists

        parameters = parameters.concat ["--config", config] if config and fs.existsSync(config)
        additionalOptions = atom.config.get('linter-swiftlint.additionalOptions')
        parameters = parameters.concat additionalOptions if additionalOptions
        options = {ignoreExitCode: true, stdin: input, throwOnStdErr: false}
        helpers.exec(command, parameters, options).then (output) ->
          helpers.parse(output, regex, {filePath: filePath})