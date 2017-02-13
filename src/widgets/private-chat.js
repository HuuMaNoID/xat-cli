'use strict'
const blessed = require('blessed')
const widget = blessed.widget
const TextChatTab = require('./text-chat-tab')

module.exports =
class PrivateChatTab extends TextChatTab {
  constructor(options) {
    const destination = options.dest

    const filters = {
      input: ({xml, types}) => {
        return types.indexOf('private-message') >= 0
          && (xml.p || xml.z).attributes.u.split('_')[0] === destination
      },
      output: ({xml}) => {
        const node = xml.p || xml.z
        return node && node.attributes.d === destination
      },
    }

    const filteredOptions = Object.assign({}, options, { filters })

    delete filteredOptions.dest
    super(filteredOptions)

    this.dest = options.dest
  }

  submitMessage(message) {
    this.client.sendPCMessage({ message, receiver: this.dest })
  }
}

