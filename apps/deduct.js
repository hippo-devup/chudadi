import { segment } from "oicq";
import fetch from "node-fetch";
import lodash from 'lodash'

const _path = process.cwd();

export class deduct extends plugin {
  constructor () {
    super({
      name: '信用管理',
      dsc: '简单开发示例',
      event: 'message',
      priority: 3000,
      rule: [
		{
			reg: '^#扣分',
			fnc: 'deduct'
		}
      ]
    })
  }

  async deduct(e) {
	  let qq = e.message.filter(item => item.type == 'at')?.map(item => item?.qq)
	  if (lodash.isEmpty(qq)) {
		  qq = e.msg.match(/\d{7,}/g)
	  } else
		  qq = qq[0]
	  
      if (!qq) return true;
	  
	  logger.info('[用户QQ]',  qq)
	  let card = await e.group.pickMember(qq).card
	  let mem  = await e.group.pickMember(qq)
	  let info = await mem.info
	  let nickname = await info.nickname
	  
	  logger.info('[用户card]',  card)
	  logger.info('[用户nickname]',  nickname)
	  
	  //let nickname=await (e.group.pickMember(qq).card || e.group.pickMember(qq).nickname)
	  e.reply(`扣分成功 @${nickname}`)
  }

}