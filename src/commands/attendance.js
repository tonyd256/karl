import moment from 'moment';
import _ from 'lodash';

const attendance = async (req, res, next) => {
  const { text } = req.body;

  // If command activated with no options, return stats.
  if (/^\s*$/.test(text)) {
    return stats(req, res, next);
  }

  // Otherwise try to find a number in the text.
  const num = text.split(" ").map(s => parseInt(s, 10)).find( n => !isNaN(n));

  // If there is a number, record it.
  if (num) {
    return addStat(req, res, next, num);
  } else {
    // If couldn't find a number then return an error message.
    res.send(200, { text: "Couldn't find the number of people. Try again?" });
    return next();
  }
};

const stats = async (req, res, next) => {
  const { channel_id } = req.body;
  const result = await req.client.query('\
    SELECT "people_count", "day"\
    FROM "attendance"\
    WHERE\
      "channel_id" = $1 AND\
      "created_at" >= now() - interval \'30 days\'\
    ORDER BY "day" DESC\
    ', [channel_id]);

  if (result.rows.length === 0) {
    res.send(200, {
      text: "No attendance has been recorded yet.",
      response_type: 'in_channel'
    });
    return next();
  }

  const last30Days = result.rows.map( row => ({
    count: row.people_count,
    day: moment(row.day)
  }));

  const fields = [];

  // 30 day average
  fields.push({
    title: 'Total',
    short: true,
    value: _.sumBy(last30Days, 'count') / last30Days.length
  });

  // 30 day Mon average
  const last30DaysMon = last30Days.filter( c => c.day.format('d') === '1');
  last30DaysMon.length === 0 ? null : fields.push({
    title: 'Mondays',
    short: true,
    value: _.sumBy(last30DaysMon, 'count') / last30DaysMon.length
  });

  // 30 day Wed average
  const last30DaysWed = last30Days.filter( c => c.day.format('d') === '3');
  last30DaysWed.length === 0 ? null : fields.push({
    title: 'Wednesdays',
    short: true,
    value: _.sumBy(last30DaysWed, 'count') / last30DaysWed.length
  });

  // 30 day Fri average
  const last30DaysFri = last30Days.filter( c => c.day.format('d') === '5');
  last30DaysFri.length === 0 ? null : fields.push({
    title: 'Fridays',
    short: true,
    value: _.sumBy(last30DaysFri, 'count') / last30DaysFri.length
  });

  res.send(200, {
    text: 'Here\'s your attendance stats for the last 30 days',
    response_type: 'in_channel',
    attachments: [
      {
        fields
      }
    ]
  });
  return next();
};

const addStat = async (req, res, next, num) => {
  const { channel_id, user_id } = req.body;

  // Update number if recorded twice
  await req.client.query('\
    INSERT INTO "attendance" ("channel_id", "user_id", "people_count")\
    VALUES ($1, $2, $3)\
    ON CONFLICT\
    ON CONSTRAINT "attendance_channel_day"\
    DO UPDATE SET "people_count" = $3\
  ', [channel_id, user_id, num]);

  res.send(200, {
    text: `Thanks <@${user_id}>! ${num} people recorded.`,
    response_type: 'in_channel'
  });
  return next();
};

export default attendance;
