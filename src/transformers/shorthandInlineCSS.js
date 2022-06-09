const posthtml = require('posthtml')
const {get, isObject, isEmpty} = require('lodash')
const mergeLonghand = require('posthtml-postcss-merge-longhand')

module.exports = async (html, config, direct = false) => {
  config = direct ? (isObject(config) ? config : true) : get(config, 'shorthandInlineCSS', [])

  const posthtmlOptions = get(config, 'build.posthtml.options', {})

  if (typeof config === 'boolean' && config) {
    html = await posthtml([mergeLonghand()]).process(html, posthtmlOptions).then(result => result.html)
  }

  if (isObject(config) && !isEmpty(config)) {
    html = await posthtml([mergeLonghand(config)]).process(html, posthtmlOptions).then(result => result.html)
  }

  return html
}
