import { BlastEngine, Mail } from 'blastengine';
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
	// メールの本文と件名
	const res = await query
		.from(process.env.HEXABASE_DATASTORE_MAIL_ID!)
		.where([
			query.condition.equalTo('i_id', mailId),
			query.condition.equalTo('Status', 'before')
		])
		.limit(1)
		.select('*');
	const template = res[0];
	if (!template) throw new Error(`${mailId}は存在しません`);
	const emails = await query
		.from(process.env.HEXABASE_DATASTORE_EMAIL_ID!)
		.where(
			query.condition.equalTo('Status', 'enable')
		)
		.limit(0)
		.select('mailaddress');
	const mail = new Mail;
	for (const email of emails) {
		mail.addTo(email.get<string>('mailaddress')!);
	}
	mail
		.setFrom(template.get<string>('fromEmail')!, template.get<string>('fromName')!)
		.setText(template.get<string>('body')!)
		.setSubject(template.get<string>('subject')!)
	await mail.send();
	await template
		.set('deliveryId', mail.deliveryId)
		.save();
	await template.execute('Sent');
})();