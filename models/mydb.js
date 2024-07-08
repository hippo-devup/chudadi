import Database from 'better-sqlite3'

const _path = process.cwd();
const mydbpath = `${_path}/data/db/chudadi.db`
const db = new Database(mydbpath, {})
db.pragma('journal_mode = WAL');

export default class mydb {
	constructor() {
		//super()
	}
	
	static create() {
		return new mydb()
	}
	
	async updateUSER(gid, uid) {
		let group  = Bot.pickGroup(gid)
		let member = group.pickMember(uid)
		let info   = member.info
		
		let nickname = info?.nickname??''		
		let cardname = member.card || ''
		let gameName = (cardname.match(/^\D+/g)||[]).join('')
		let gameID   = (cardname.match(/\d{9}/g)||[]).join('')

		let last_sent_time = info?.last_sent_time ?? 0
		let age      = info?.age??-1

		
		let gender = info?.sex??-1
		gender = ["unknown", "female", "male"].indexOf(gender) - 1

		const update = db.prepare('update user set grpNickname = ?, ysNickname = ?, nickname = ?, ysUID = ?, age = ?, gender  = ?, last_sent_time = ? where uid = ?')//level不需要更新
		let ret = update.run(cardname, gameName, nickname, gameID, age, gender, last_sent_time, uid)
		
		return ret.changes
	}
		
		
	async recordUSER(gid, uid, mmap) {
		let row = db.prepare('select * from user where uid = ?').get(uid)
		if (row) {
			if (row.last_sent_time == mmap?.get(uid)?.last_sent_time)
				return
		}
		
		let group = await Bot.pickGroup(gid);
		let member = await group.pickMember(uid)
			
		let cardname = await ( member.card || '')
		let info = await (member.info)

		let last_sent_time = info?info.last_sent_time:0
		
		if (row) {
			const update = db.prepare('update user set last_sent_time = ? where uid = ? and last_sent_time < ?')
			update.run(last_sent_time, uid, last_sent_time)
			return 2
		} else {
			let gameName = await (cardname.match(/^\D+/g)||[]).join('')
			let gameID   = await (cardname.match(/\d{9}/g)||[]).join('')
			let age    = info?info.age:-1
			let nickname = info?info.nickname:''
			
			let group_id = gid
			let level    = info?info.level:1
			
			let gender = info?info.sex:-1
			gender = ["unknown", "female", "male"].indexOf(gender) - 1

			logger.info('新会员记录', [uid, gameID, nickname, cardname, gameName, group_id, last_sent_time, gender, level, age])
			const insert = db.prepare('insert into user(uid, ysUID, nickname, grpNickname, ysNickname, last_gid, last_sent_time, gender, level, age) values(?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
			insert.run(uid, gameID, nickname, cardname, gameName, group_id, last_sent_time, gender, level, age);
			return 1
		}
		
		return false
	}
	
	async reduceCoin(uid, coin) {
		let update = db.prepare('update user set coin = coin - ? where uid = ? and coin > ?')
		let ret    = update.run(coin, uid, coin)
		return ret.changes > 0
	}
}
