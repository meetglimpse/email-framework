const {get, has, remove} = require('lodash')
const postcss = require('postcss')
const posthtml = require('posthtml')
const parseAttrs = require('posthtml-attrs-parser')
const matchHelper = require('posthtml-match-helper')

module.exports = async (html, config = {}) => {
  if (get(config, 'removeInlinedClasses') === false) {
    return html
  }

  const posthtmlOptions = get(config, 'build.posthtml.options', {})
  return posthtml([plugin()]).process(html, posthtmlOptions).then(result => result.html)
}

const plugin = () => tree => {
  const process = node => {
    // For each style tag...
    if (node.tag === 'style') {
      const {root} = postcss().process(node.content)

      root.walkRules(rule => {
        // Skip media queries and such...
        if (rule.parent.type === 'atrule') {
          return
        }

        const {selector} = rule
        const prop = get(rule.nodes[0], 'prop')

        // If we find the selector in the HTML...
        tree.match(matchHelper(selector), n => {
          const parsedAttrs = parseAttrs(n.attrs)
          const classAttr = get(parsedAttrs, 'class', [])
          const styleAttr = get(parsedAttrs, 'style', {})

          // If the class is in the style attribute (inlined), remove it
          if (has(styleAttr, prop)) {
            // Remove the class attribute
            remove(classAttr, s => selector.includes(s))

            // Remove the rule in the <style> tag
            rule.remove()
          }

          /**
           * Remove from <style> selectors that were used to create shorthand declarations
           * like `margin: 0 0 0 16px` (transformed with mergeLonghand when inlining).
           */
          Object.keys(styleAttr).forEach(key => {
            if (prop.includes(key)) {
              rule.remove()
              remove(classAttr, s => selector.includes(s))
            }
          })

          n.attrs = parsedAttrs.compose()

          return n
        })
      })

      node.content = root.toString()
    }

    return node
  }

  return tree.walk(process)
}
