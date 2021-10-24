var CronJob = require('cron').CronJob;
const { moveDiscussionsToDB,postScheduledAnnouncements } = require('../controllers/rooms');

module.exports = {
    moveDiscussionsToDBJob,
    postScheduledAnnouncementsJob
}

var moveDiscussionsToDBJob = new CronJob('*/15 * * * *', function() {
  console.log('Moving Discussion Data to DB');
  moveDiscussionsToDB();
}, null, true, process.env.TIMEZONE);

var postScheduledAnnouncementsJob = new CronJob('* * * * *', async function() {
  console.log('Posting announcement |START|');
  await postScheduledAnnouncements();
  console.log('Posting announcement |END|');

}, null, true, process.env.TIMEZONE);
//moveDiscussionsToDBJob.stop()