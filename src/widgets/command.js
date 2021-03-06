'use strict'

const blessed = require('blessed')
const widget = blessed.widget

const History = require('../util/history')

module.exports =
class CommandLine extends widget.textbox {
  constructor(options) {
    super(Object.assign({}, options, {
      inputOnFocus: true,
      tags: true,
    }))


    const screen = this.screen
    const chat = this.chat = options.chat
    const client = this.client = options.client
    const config = this.config = options.config

    this.history = new History(this)

    const command = this

    let commandHistory = [];
    let commandHistoryPointer = -1;

    this.on('submit', this.handleSubmit.bind(this))

    command.on('focus', function () {
      command.setValue(':');
      screen.render();
    });
    command.key(['backspace'], function (ch, key) {
      if (command.value === '') {
        command.cancel();
      }
    });
    command.key(['up', 'down'], function (ch, key) {
    });
    command.on('keypress', (ch, key) => {
      if (key.name !== 'up' && key.name !== 'down') {
        commandHistoryPointer = -1;
      }
    });
    command.on('submit', function (value) {
    });
  }

  handleSubmit(value) {
    const { chat, client, screen, config } = this
    const setError = (message) => {
      this.setContent('{red-bg}{white-fg}{bold}' + message + '{/}');
      screen.render();
    }

    value = value.substr(1).trim();

    const args = value.split(' ');
    const cmd = args[0];
    const argTail = args.slice(1).join()

    let error = null;
    let response = ''

    const nolog = () => {
      chat.logBox.hide();
      chat.currentTab.show();
      chat.chatbox.focus();
      screen.realloc();
      screen.render();
    }

    if (cmd === 'q' || cmd === 'qa') {
      const all = cmd[1] === 'a'
      if (!chat.logBox.hidden && !all) {
        nolog()
      } else {
        process.exit();
      }
    } else if (value === 'm') {
      chat.currentTab.messagesBox.focus();
    } else if (value === 'w') {
      config.save().catch((e) => {
        setError(JSON.stringify(e))
      })
    } else if (value === 'u') {
      chat.currentTab.usersBox.focus();
    } else if (cmd === 'log') {
      chat.currentTab.hide();
      chat.logBox.show();
      chat.logBox.focus();
      screen.realloc();
      screen.render();
    } else if (cmd === 'nolog') {
      nolog()
    } else if (cmd === 'signin') {
      client.sendTextMessage('/go#' + args[1]);
      const redirect = function redirect(data) {
        if (data.q && data.q.attributes.r) {
          client.removeListener('data', redirect);
          client.end();
          client.todo.w_useroom = data.q.attributes.r;
          client.connect();
        }
      }
      client.on('data', redirect);
    } else if (cmd === 'id2reg' || cmd === 'idtoreg') {
      if (!config.httpservices || !config.httpservices.id2reg) {
        return setError('id2reg is not supported');
      }

      if (!args[1]) {
        return setError('id2reg invalid format. Usage: id2reg id');
      }

      const id2reg = config.httpservices.id2reg;

      http.get(id2reg.url.replace(id2reg.placeholder, args[1]), (res) => {
        let body = '';
        res.on('data', (chunk) => body += chunk);
        res.on('end', () => {
          this.setValue(`id2reg for ${args[1]} is ${id2reg.fetchResult(body)}`);
          screen.render();
        });
      }).on('error', (e) => {
        setError('id2reg http error:' + JSON.stringify(e));
      });
    } else if (cmd === 'locate' || value.substr(0, 2) === '/l') {
      const target = value.substr(0, 2) === '/l' && value[2] !== ' '
        ? value.substr(2)
        : args[1]

      client.sendLocate(target);
    } else if (cmd === 'hiddenmode') {
      if (!args[1]) {
        this.setValue(`State of hiddenmode: ${hiddenMode ? 'on' : 'off'}`);
        screen.render();
        return;
        //return setError('Usage: hiddenmode [on|off]');
      }
      //hiddenMode = args[1].toLowerCase() === 'on';
    } else if (cmd === 'fromsol') {
      config.fromSol(argTail)
        .then(() => {
          client.end()
          const { w_useroom } = client.todo
          client.todo = Object.assign({}, this.config.user.todo, {
            w_useroom,
          })
          client.connect()
        })
        .catch((e) => setError(JSON.stringify(e)))
    } else if (cmd === 'chname') {
      this.client.todo.w_name = argTail
    } else if (cmd === 'reconnect') {
      client.end()
      client.connect()
    } else if (cmd === 'tab') {
      chat.tabsBar.selectTab(parseInt(argTail) - 1)
    } else if (cmd === 'tabf') {
      chat.tabsBar.focus()
    } else if (cmd === 'pm') {
      chat.createPM(argTail)
    } else if (cmd === 'pc') {
      chat.createPC(argTail)
    } else if (cmd === 'lurkerlog') {
      chat.createLurkerLog()
    } else if (cmd === 'qt') {
      chat.closeCurrentTab()
    } else if (cmd === 'qu') {
      chat.currentTab.closeUserInfo()
    } else {
      return setError('Unknown command: ' + value);
    }

    this.setValue('');
    screen.render();
  }
}
