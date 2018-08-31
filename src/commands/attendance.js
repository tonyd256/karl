import moment from 'moment';
import _ from 'lodash';

const attendance = async (req, res, next) => {
  const { channel_id, user_id, command, text } = req.body;

  // If command activated with no options, return stats.
  if (/^\s*$/.test(text)) {
    const result = await req.client.query('\
      SELECT "people_count", "day"\
      FROM "attendance"\
      WHERE "channel_id" = $1\
      ORDER BY "day" DESC\
      ', [channel_id]);

    if (result.rows.length === 0) {
      res.send(200, {
        text: "No attendance has been recorded yet.",
        response_type: 'in_channel'
      });
      return next();
    }

    const now = moment();
    const counts = result.rows.map( row => ({
      count: row.people_count,
      day: moment(row.day)
    }));

    // 30 day average
    const daysAgo30 = now.subtract(30, 'days');
    const last30Days = counts.filter( c => c.day.isAfter(daysAgo30));
    const last30DayAvg = _.sumBy(last30Days, 'count') / last30Days.length;
    const last30DayAvgText = `\nLast 30 Day Avg: ${last30DayAvg}`;

    // 30 day Wed average
    const last30DaysWed = last30Days.filter( c => c.day.format('d') === '3');
    const last30DayWedAvg = last30DaysWed.length === 0 ? 0 : _.sumBy(last30DaysWed, 'count') / last30DaysWed.length;
    const last30DayWedAvgText = last30DayWedAvg === 0 ? '' : `\nWednesday average in the last 30 days: ${last30DayWedAvg}`;

    // 30 day Mon average
    const last30DaysMon = last30Days.filter( c => c.day.format('d') === '1');
    const last30DayMonAvg = last30DaysMon.length === 0 ? 0 : _.sumBy(last30DaysMon, 'count') / last30DaysMon.length;
    const last30DayMonAvgText = last30DayMonAvg === 0 ? '' : `\nMonday average in the last 30 days: ${last30DayMonAvg}`;

    // 30 day Fri average
    const last30DaysFri = last30Days.filter( c => c.day.format('d') === '5');
    const last30DayFriAvg = last30DaysFri.length === 0 ? 0 : _.sumBy(last30DaysFri, 'count') / last30DaysFri.length;
    const last30DayFriAvgText = last30DayFriAvg === 0 ? '' : `\nFriday average in the last 30 days: ${last30DayFriAvg}`;

    res.send(200, {
      text: `Here's your stats${last30DayAvgText}${last30DayMonAvgText}${last30DayWedAvgText}${last30DayFriAvgText}`,
      response_type: 'in_channel'
    });
    return next();
  }

  // Otherwise try to find a number in the text.
  const num = text.split(" ").map(s => parseInt(s, 10)).find( n => !isNaN(n));

  // If there is a number, record it.
  // Update number if recorded twice
  if (num) {
    await req.client.query('\
      INSERT INTO "attendance" ("channel_id", "user_id", "people_count")\
      VALUES ($1, $2, $3)\
      ON CONFLICT\
      ON CONSTRAINT "attendance_channel_day"\
      DO UPDATE SET "people_count" = $3\
    ', [channel_id, user_id, num]);

    res.send(200, {
      text: `Thanks <@${user_id}>! Wow, ${num} people. Great Work!`,
      response_type: 'in_channel'
    });
    return next();
  } else {
    // If couldn't find a number then return an error message.
    res.send(200, { text: "Couldn't find the number of people. Try again?" });
    return next();
  }
};

export default attendance;
