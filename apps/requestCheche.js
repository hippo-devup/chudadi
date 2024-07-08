import plugin from '../../../lib/plugins/plugin.js';
import fetch from 'node-fetch';
import fs from 'fs';
import config from './components/setting.js';
import path from "path";
import { Group, segment } from "oicq";

const __dirname = path.resolve();

const settings = {
    // 表情包文件存放路径
    emoji_path: path.join(__dirname, "/plugins/chudadi/resource/image/emoji"),
}

const groups = config.getConfig('general').groups

export class requestCheche extends plugin {
  constructor () {
    super({
      name: '呼叫车车',
      dsc: '跨群叫车',
      /** https://oicqjs.github.io/oicq/#events */
      event: 'message',
      /** 优先级，数字越小等级越高 */
      priority: 5000,
      rule: [
	    {
          reg: '^#?(矿|刀镡|蕈兽|肉|圣骸兽|骗骗花|花|飘浮灵|-6|[cC][Pp])车有无',
          fnc: 'request_cheche'
		},
        {
          reg: '^#?来点(矿车|刀镡|蕈兽|肉车|圣骸兽|骗骗花|花车|飘浮灵|-6叭|[cC][Pp])',
          fnc: 'request_cheche'
        },
        {
          reg: '^#?来点-6',
          fnc: 'request_neg6'
        },
        {
          reg: '^#?来点帮助',
          fnc: 'request_help'
        }
      ]
    })
  }
  
  async request_cheche (e) {
	  let group_id = e.group_id ?? 0
	  
	  let restext = e.msg.replace('#', '').replace('来点', '').replace('车有无', '车')
	  
	  for (let i = 0; i < groups.length; i++) {
		  if (groups[i] != group_id) {
			let group = Bot.pickGroup(groups[i]);
			await group.sendMsg('来点' + restext)
		  }
	  }
	  e.reply('已广播')
  }
  
  async request_help (e) {
	  let restext = '#来点+需要的资源\n比如#来点-6\n当前支持的车：矿车、刀镡、骗骗花、圣骸兽、飘浮灵、CP'
	  
	  e.reply(restext)
  }
  
  async request_neg6 (e) {
	  let group_id  = e.group_id ?? 0
	  let finalPath = path.join(settings.emoji_path, '-6.jpg');
	  let bitMap    = fs.readFileSync(finalPath);
	  let base64    = Buffer.from(bitMap, 'binary').toString('base64');
	  let msg       = [segment.image(`base64://${base64}`)]
	  
	  for (let i = 0; i < groups.length; i++) {
		  if (groups[i] != group_id) {
			let group = Bot.pickGroup(groups[i]);
			await group.sendMsg(msg)
		  }
	  }
	  
	  e.reply('已广播')
  }
}