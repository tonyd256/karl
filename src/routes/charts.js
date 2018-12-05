import errors from 'restify-errors';
import Chart from 'chartjs-node';
import moment from 'moment';

const charts = async function (req, res, next) {
  try {
    const result = await req.client.query('\
      SELECT "people_count", "day"\
      FROM "attendance"\
      WHERE\
        "channel_id" = $1 AND\
        "day" >= to_date($2, \'YYYY-MM-DD\') - (interval \'1 days\' * $3)\
      ORDER BY "day" DESC\
      ', [req.params.channel, req.params.date_text, parseInt(req.query.days, 10) || 30]);

    const data = result.rows.map( row => ({
      x: moment(row.day),
      y: row.people_count
    }));

    var datasets = [];//[{
    //   label: 'Overall',
    //   data: data,
    //   borderColor: '#1e88e5',
    //   borderWidth: 3,
    //   fill: false
    // }];

    const friData = data.filter( c => c.x.format('d') === '5');
    if (friData.length > 0) {
      datasets.push({
        label: 'Friday',
        data: friData,
        borderColor: '#689f38',
        borderWidth: 3,
        fill: false
      });
    }

    const wedData = data.filter( c => c.x.format('d') === '3');
    if (wedData.length > 0) {
      datasets.push({
        label: 'Wednesday',
        data: wedData,
        borderColor: '#7b1fa2',
        borderWidth: 3,
        fill: false
      });
    }

    const monData = data.filter( c => c.x.format('d') === '1');
    if (monData.length > 0) {
      datasets.push({
        label: 'Monday',
        data: monData,
        borderColor: '#f4511e',
        borderWidth: 3,
        fill: false
      });
    }

    const chart = new Chart(600, 400);
    chart.drawChart({
      type: 'line',
      data: {
        datasets: datasets.reverse()
      },
      options: {
        responsive: false,
        animation: false,
        scales: {
          yAxes: [{
            display: true,
            ticks: {
              beginAtZero: true
            }
          }],
          xAxes: [{
            display: true,
            type: 'time',
            time: {
              minUnit: 'day'
            }
          }]
        }
      }
    }).then(() => chart.getImageBuffer('image/png'))
      .then(buffer => {
        res.setHeader('Content-Type', 'image/png');
        res.sendRaw(buffer, { 'content-type': 'image/png' });
        chart.destroy();
        return next();
      });
  } catch (e) {
    req.log.error(e);
    return next(new errors.InternalServerError());
  } finally {
    req.client.release();
  }
};

export default charts;
