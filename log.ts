import { BlastEngine, Log } from 'blastengine';
import { HexabaseClient } from '@hexabase/hexabase-js';
import 'dotenv/config';

new BlastEngine(process.env.BLASTENGINE_USER_ID!, process.env.BLASTENGINE_API_KEY!);
const client = new HexabaseClient();
(async () => {
	await client.setToken(process.env.HEXABASE_PUBLIC_TOKEN!);
	const mailId = process.argv[2];
	if (!mailId) throw new Error('メールIDが指定されていません');
	await client.setWorkspace(process.env.HEXABASE_WORKSPACE_ID!);
	const query = client.query(process.env.HEXABASE_PROJECT_ID!);

	const logs = await Log.find({
		status: ['HARDERROR']
	});
	for (const log of logs) {
		const { email } = log;
		const emails = await query
			.from(process.env.HEXABASE_DATASTORE_EMAIL_ID!)
			.where([
				query.condition.equalTo('mailaddress', email),
				query.condition.equalTo('Status', 'enable')
			])
			.limit(1)
			.select('mailaddress, sendError');
		if (emails.length === 0) continue;
		const mail = emails[0];
		await mail
			.set('sendError', log.lastResponseMessage)
			.save();
		await mail.execute('Error');
	}
})();