import Chart from 'chartjs-node';

const charts = async function (req, res, next) {
  try {
    const result = await req.client.query('\
      SELECT "people_count", "day"\
      FROM "attendance"\
      WHERE\
        "channel_id" = $1 AND\
        "created_at" >= to_date($2, \'YYYY-MM-DD\') - interval \'30 days\'\
      ORDER BY "day" DESC\
      ', [req.params.channel, req.params.date_text]);

    const chart = new Chart(800, 400);
    chart.drawChart({
      type: 'line',
      data: {
        datasets: [
          {
            label: 'Overall - Past 30 Days',
            data: result.rows.map( row => ({
              x: new Date(row.day),
              y: row.people_count
            })),
            borderColor: '#1e88e5',
            borderWidth: 3,
            fill: false
          }
        ]
      },
      options: {
        responsive: false,
        animation: false,
        scales: {
          yAxes: [{
            display: true,
            scaleLabel: {
              display: true,
              labelString: 'Avg People'
            },
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
    console.log(e);
  }
};

export default charts;
