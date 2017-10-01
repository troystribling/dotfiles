# JavaScript Semantic Highlighting Package for Atom
#
# Copyright (c) 2014-2015 Philipp Emanuel Weidmann <pew@worldwidemann.com>
#
# Nemo vir est qui mundum non reddat meliorem.
#
# Released under the terms of the MIT License (http://opensource.org/licenses/MIT)

$ = require "jquery"
{Grammar} = require "first-mate"
acorn = require "./acorn-modified.js"

numberOfColors = 8

module.exports =
class JavaScriptSemanticGrammar extends Grammar
  constructor: (registry) ->
    name = "JavaScript (Semantic Highlighting)"
    scopeName = "source.js-semantic"
    super(registry, {name, scopeName})

  # Ensures that grammar takes precedence over standard JavaScript grammar
  getScore: ->
    jsGrammar = @registry.grammarForScopeName("source.js")
    return if jsGrammar? then (jsGrammar.getScore.apply(jsGrammar, arguments) + 1) else 0

  acornTokenize: (line) ->
    tokens = []
    rules = []

    onComment = (block, unterminated, text, start, end) ->
      # Add a faux-token for comment since Acorn doesn't tokenize comments
      tokens.push { start: start, end: end, type: { type: "comment", unterminated: unterminated } }
      if unterminated
        rules.push "unterminated_comment"

    try
      tokenizer = acorn.tokenize(line, { locations: true, onComment: onComment })
    catch error
      # Error in initTokenState
      return { tokens: tokens, rules: rules }

    while true
      try
        token = tokenizer()
      catch error
        return { tokens: tokens, rules: rules }
      # Object is mutable, therefore it must be cloned
      token = $.extend(true, {}, token)
      if token.type.type is "eof"
        return { tokens: tokens, rules: rules }
      tokens.push token

  # Converted from http://stackoverflow.com/a/7616484
  # with the help of http://js2coffee.org/
  hash: (string) ->
    hash = 0
    return hash if string.length is 0
    i = 0
    len = string.length
    while i < len
      chr = string.charCodeAt(i)
      hash = ((hash << 5) - hash) + chr
      hash |= 0
      i++
    return hash

  colorIndex: (string) ->
    (Math.abs(@hash(string)) % numberOfColors) + 1

  tokenScopes: (token, text) ->
    if token.type.type is "name"
      colorIndexScope = "color-index-" + @colorIndex(text)
      return "identifier." + colorIndexScope
    else if token.type.type is "comment"
      return "comment"
    else if token.type.hasOwnProperty("keyword")
      return "keyword"
    else if token.type.type is "num"
      return "number"
    else if token.type.type is "string"
      return "string"
    else if token.type.type is "regexp"
      return "regex"
    return null

  tokenizeLine: (line, ruleStack, firstLine = false) ->
    tags = []
    tokens = []

    outerRegistry = @registry
    addToken = (text, scopes = null) ->
      fullScopes = "source.js-semantic" + (if scopes? then ("." + scopes) else "")
      tags.push outerRegistry.startIdForScope(fullScopes)
      tags.push text.length
      tags.push outerRegistry.endIdForScope(fullScopes)
      tokens.push { value: text, scopes: [fullScopes] }

    acornStartOffset = 0
    if ruleStack? and "unterminated_comment" in ruleStack
      # Help Acorn tokenize multi-line comments correctly
      commentEnd = line.indexOf("*/")
      if commentEnd is -1
        # Multi-line comment continues
        addToken line, "comment"
        return { line: line, tags: tags, tokens: tokens, ruleStack: ruleStack }
      else
        # Make Acorn skip over partial comment
        acornStartOffset = commentEnd + 2
        addToken line.substring(0, acornStartOffset), "comment"

    acornLine = line.substring(acornStartOffset)

    tokenizeResult = @acornTokenize(acornLine)
    acornTokens = tokenizeResult.tokens
    # Comment tokens might have been inserted in the wrong place
    acornTokens.sort((a, b) -> a.start - b.start)

    tokenPos = 0
    for token in acornTokens
      text = acornLine.substring(token.start, token.end)
      tokenScopes = @tokenScopes(token, text)
      if tokenScopes?
        if token.start > tokenPos
          addToken acornLine.substring(tokenPos, token.start)
        addToken text, tokenScopes
        tokenPos = token.end

    if tokenPos < acornLine.length
      addToken acornLine.substring(tokenPos)

    if tokens.length is 0
      addToken ""

    return { line: line, tags: tags, tokens: tokens, ruleStack: tokenizeResult.rules }
