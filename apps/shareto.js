import plugin from '../../../lib/plugins/plugin.js';
import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import Database from 'better-sqlite3';
import { Group, segment } from 'oicq';
import mydb from '../models/mydb.js'
import config from './components/setting.js';

const _path = process.cwd();
const db = new Database(`${_path}/data/db/chudadi.db`, {})
db.pragma('journal_mode = WAL');

const groups = config.getConfig('general').groups
const external_group = config.getConfig('general').external_groups
const auto_record = config.getConfig('general').auto_record

export class shareto extends plugin {
  constructor () {
    super({
      name: '转发车车',
      dsc:  '转发别的群的车车',
      event: 'message',
      priority: 5000,
      rule: [
        {
			reg: '^\s*(\\d){9}.*?(=|＝|≈|等)\s*[1234].*$',
			fnc: 'share'
        },
		{
			reg: '#修复用户信息',
			fnc: 'fixUserInfo'
		}
      ]
    })
	
    /**定时任务 */
	if (auto_record) {
		this.task = {
		  cron: "* */2 * * * *",
		  name: "自动收录用户",
		  fnc: () => this.newRecordTask(),
		  log: true,
		};
	}
  }
  
  /**修复用户信息**/
  async fixUserInfo(e) {
	  const list = db.prepare('select * from user where age = -1').all()
	  let util = mydb.create()
	  for (let user of list) {
		  let ret = await util.updateUSER(user.last_gid, user.uid)
		  if (ret >= 1) await e.reply('更新' + user.uid + '成功')
	  }
  }
  
  async share(e) {
	  let group_id = 0
	  let nickname = ''
	  let qq = e.user_id
	  let pt = 0//更新的积分
	  
	  if (e.isGroup) {
		  group_id = e.group_id
		  nickname = await (e.group.pickMember(qq).card || e.group.pickMember(qq).nickname)
		  nickname = nickname?.replace(/\s*\d{9}(-\d{1})?/, '')
	  } else {
		  nickname = '一位旅行者'
	  }
	  
	  if (external_group.indexOf(group_id) >= 0) {
		if (e.msg.indexOf('圣骇兽')== -1) return;
	  }
	  
	  let ret1 = await redis.set(`chudadi:time:${qq}`, '1', { EX: 300, NX: true})
	  if (!ret1) return;
	  
	  for (let i = 0; i < groups.length; i++) {
		if(groups[i] == group_id) continue
		  
		let group = Bot.pickGroup(groups[i]);
		await group.sendMsg('转自 ' + (nickname??'旅行者') + ' ' + this.e.msg)
	  }
	  
	  let now = new Date()
	  let timeleft = 86400 - (Math.round(now.getTime() /1000) + 8 * 3600) % 86400
	  logger.info('time left', timeleft)
	  let mMap = {'花车': '骗骗花','+6V1': '+6V2', '+6': '+6V2', '神秘肉': '兽肉', '紫晶矿': '矿', '紫晶块': '矿', '孢子': '蕈兽'}
	  let rr = e.msg.match(/圣骸兽|刀镡|兽肉|神秘肉|鱼肉|矿|-6|[+]6V2|[+]6V1|[+]6|漂浮灵|骗骗花|花车|紫晶块|紫晶矿|孢子|蕈兽|丘丘游侠/)
	  if (qq > 10000 && rr) {//加分逻辑
		  let type = rr[0]
		  type = mMap[type] || type
		  let add_coin = 0
		  
		  let ret = await redis.set(`chudadi:${type}:${qq}`, '1', { EX: timeleft, NX: true})
		  if (ret) {
			  add_coin = 1//满足条件+1分
		  }
		  
		  const updateCoin = db.prepare('update user set coin = coin + ?, level = level + 1 where uid = ?');
		  let ret1 = updateCoin.run(add_coin, qq);
		  if (ret1.changes <= 0) {
			  if (group_id > 0) {
				let util = mydb.create()
				let mmap = await e.group.getMemberMap();
				let ret2 = await util.recordUSER(group_id, qq, mmap)
				if (ret2 == 1) {//插入新的会员
					ret1 = updateCoin.run(add_coin, qq);
					if (ret1.changes > 0) pt = add_coin //插入成功
				} else {
					logger.mark('new member', 'fail')
				}
			  }
		  } else {
			  pt = add_coin
		  }
	  }
	  
	  if (pt > 0) {
		  nickname = (nickname || '旅行者').replace(/[-\\]+\s*$|^\s*[-\\]+/, '').replace(/[-\\]+\s*$|^\s*[-\\]+/, '')
	      await e.reply(`已转，${nickname} +1分，同类车每日最多加1分，分数情况可以【#分数排名】`)
	  }
	  else
	      await e.reply(`已转`)
	  
	  let subscriber = await redis.sMembers(`chudadi_subscribe_boss_${qq}`)
	  
	  if (subscriber && group_id) {
		  for (let per_qq of subscriber) {
			await Bot.pickMember(group_id, per_qq)?.sendMsg(`大佬${nickname}发车了`)
		  }
	  }
  }
  
  async newRecordTask() {
	let gid   = groups[Math.floor(Math.random() * 4)];
	let group = await Bot.pickGroup(gid);
	let mmap  = await group.getMemberMap();
	let uids  = []
	if (mmap.size) {
		mmap.forEach((v, k, c)=>{
			if (Math.random() <= 0.1) {
				uids.push(k)
			}
		})
	}
	
	if (uids.length) {
		let util = mydb.create()
		//logger.info('会员', uids)
		for (let uid of uids)
			await util.recordUSER(gid, uid, mmap)
	}
  }
}