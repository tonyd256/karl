import errors from 'restify-errors';
import config from '../config';
import moment from 'moment';
import _ from 'lodash';

const attendance = async (req, res, next) => {
  const { text } = req.body;

  // Otherwise try to find a number in the text.
  const options = text.split(' ');

  if (options.length > 0) {
    if (!isNaN(parseInt(options[0], 10))) {
      return addStat(req, res, next, parseInt(options[0], 10), options[1]);
    } else if (options.length > 0 && options[0] === 'stats') {
      return stats(req, res, next, parseInt(options[1], 10) || 30);
    }
  } else {
    return stats(req, res, next, 30);
  }

  // If couldn't find a number then return an error message.
  res.send(200, { text: "I couldn't understand what you're trying to do. Try again?" });
  req.client.release();
  return next();
};

const stats = async (req, res, next, days) => {
  const { text, channel_id } = req.body;

  try {
    const result = await req.client.query('\
      SELECT "people_count", "day"\
      FROM "attendance"\
      WHERE\
        "channel_id" = $1 AND\
        "day" >= now() - (interval \'1 days\' * $2)\
      ORDER BY "day" DESC\
      ', [channel_id, days]);

    if (result.rows.length === 0) {
      res.send(200, {
        text: "No attendance has been recorded yet.",
        response_type: 'in_channel'
      });
      return next();
    }

    const lastDays = result.rows.map( row => ({
      count: row.people_count,
      day: moment(row.day)
    }));

    const fields = [];

    // x day average
    fields.push({
      title: 'Total',
      short: true,
      value: _.sumBy(lastDays, 'count') / lastDays.length
    });

    // x day Mon average
    const lastDaysMon = lastDays.filter( c => c.day.format('d') === '1');
    lastDaysMon.length === 0 ? null : fields.push({
      title: 'Mondays',
      short: true,
      value: _.sumBy(lastDaysMon, 'count') / lastDaysMon.length
    });

    // x day Wed average
    const lastDaysWed = lastDays.filter( c => c.day.format('d') === '3');
    lastDaysWed.length === 0 ? null : fields.push({
      title: 'Wednesdays',
      short: true,
      value: _.sumBy(lastDaysWed, 'count') / lastDaysWed.length
    });

    // x day Fri average
    const lastDaysFri = lastDays.filter( c => c.day.format('d') === '5');
    lastDaysFri.length === 0 ? null : fields.push({
      title: 'Fridays',
      short: true,
      value: _.sumBy(lastDaysFri, 'count') / lastDaysFri.length
    });

    res.send(200, {
      text: `Here's your attendance stats for the last ${days} days`,
      response_type: 'in_channel',
      attachments: [
        {
          fields,
          image_url: `${config.apiUrl}/charts/${channel_id}/${moment().format('YYYY-MM-DD')}/image.png?days=${days}`
        }
      ]
    });
    return next();
  } catch (e) {
    req.log.error(e);
    return next(new errors.InternalServerError());
  } finally {
    req.client.release();
  }
};

const dateFormats = [
  'M-D-YYYY',
  'M/D/YYYY',
  'M/D',
  'M-D'
];

const addStat = async (req, res, next, num, dateString) => {
  const { channel_id, user_id } = req.body;

  if (dateString && !moment(dateString, dateFormats, true).isValid()) {
    res.send(200, { text: "I couldn't understand the date you entered. Try again?" });
    req.client.release();
    return next();
  }

  const date = moment(dateString, dateFormats, true);

  try {
    // Update number if recorded twice
    await req.client.query('\
      INSERT INTO "attendance" ("channel_id", "user_id", "people_count", "day")\
      VALUES ($1, $2, $3, COALESCE($4, now()))\
      ON CONFLICT\
      ON CONSTRAINT "attendance_channel_day"\
      DO UPDATE SET "people_count" = $3\
    ', [channel_id, user_id, num, date.isValid() ? date.toDate() : null]);

    res.send(200, {
      text: `Thanks <@${user_id}>! ${num} people recorded.`,
      response_type: 'in_channel'
    });
    return next();
  } catch (e) {
    req.log.error(e);
    return next(new errors.InternalServerError());
  } finally {
    req.client.release();
  }
};

export default attendance;
