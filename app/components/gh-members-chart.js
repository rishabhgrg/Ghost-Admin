/* global Chart */
import Component from '@ember/component';
import moment from 'moment';
import {computed, get} from '@ember/object';

export default Component.extend({
    members: null,
    range: '30',
    selectedRange: computed('range', function () {
        const availableRange = this.get('availableRange');
        return availableRange.findBy('slug', this.get('range'));
    }),
    availableRange: computed(function () {
        return [
            {
                name: 'Last 10 days',
                slug: '10'
            },
            {
                name: 'Last 30 days',
                slug: '30'
            },
            {
                name: 'Last 60 days',
                slug: '60'
            },
            {
                name: 'Last 90 days',
                slug: '90'
            }
        ];
    }),

    subData: computed('members.@each', 'range', function () {
        let {members, range} = this;
        let rangeInDays = parseInt(range);
        let startDate = moment().subtract((rangeInDays - 1), 'days');
        let totalSubs = members.length || 0;
        let totalSubsLastMonth = members.filter((member) => {
            let isValid = moment(member.createdAtUTC).isSameOrAfter(startDate, 'day');
            return isValid;
        }).length;

        let totalSubsToday = members.filter((member) => {
            let isValid = moment(member.createdAtUTC).isSame(moment(), 'day');
            return isValid;
        }).length;
        return {
            chartData: this.getChartData(members, rangeInDays),
            totalSubs: totalSubs,
            totalSubsToday: totalSubsToday,
            totalSubsLastMonth: totalSubsLastMonth
        };
    }),

    init() {
        this._super(...arguments);
        Chart.defaults.LineWithLine = Chart.defaults.line;
        Chart.controllers.LineWithLine = Chart.controllers.line.extend({
            draw: function (ease) {
                Chart.controllers.line.prototype.draw.call(this, ease);

                if (this.chart.tooltip._active && this.chart.tooltip._active.length) {
                    var activePoint = this.chart.tooltip._active[0],
                        ctx = this.chart.ctx,
                        x = activePoint.tooltipPosition().x,
                        topY = this.chart.scales['y-axis-0'].top,
                        bottomY = this.chart.scales['y-axis-0'].bottom;

                    // draw line
                    ctx.save();
                    ctx.beginPath();
                    ctx.moveTo(x, topY);
                    ctx.lineTo(x, bottomY);
                    ctx.lineWidth = 2;
                    ctx.strokeStyle = '#343f44';
                    ctx.stroke();
                    ctx.restore();
                }
            }
        });
    },

    actions: {
        changeDateRange(range) {
            this.set('range', get(range, 'slug'));
        }
    },

    getChartData(members, range) {
        let dateFormat = 'D MMM';
        let monthData = [];
        let dateLabel = [];
        let startDate = moment().subtract((range - 1), 'days');
        for (let i = 0; i < range; i++) {
            let m = moment(startDate).add(i, 'days');
            dateLabel.push(m.format(dateFormat));
            let membersTillDate = members.filter((member) => {
                let isValid = moment(member.createdAtUTC).isSameOrBefore(m, 'day');
                return isValid;
            }).length;
            monthData.push(membersTillDate);
        }
        return {
            data: {
                labels: dateLabel,
                datasets: [{
                    /** Options: https://www.chartjs.org/docs/latest/charts/line.html#dataset-properties */
                    label: 'Total Members',
                    lineTension: 0,
                    data: monthData,
                    fill: false,
                    backgroundColor: 'rgba(62,176,239,.9)',
                    pointRadius: 0,
                    pointHitRadius: 10,
                    borderColor: 'rgba(62,176,239,.9)'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                title: {
                    /** Options: https://www.chartjs.org/docs/latest/configuration/title.html */
                    display: false
                },
                tooltips: {
                    intersect: false,
                    mode: 'index',
                    displayColors: false
                },
                hover: {
                    mode: 'index',
                    intersect: false
                },
                legend: {
                    /** https://www.chartjs.org/docs/latest/configuration/legend.html */
                    display: false
                },
                scales: {
                    /**https://www.chartjs.org/docs/latest/axes/cartesian/linear.html */
                    xAxes: [{
                        labelString: 'Date',
                        gridLines: {
                            drawTicks: false
                        },
                        ticks: {
                            maxRotation: 0,
                            minRotation: 0,
                            padding: 6,
                            autoSkip: false,
                            maxTicksLimit: 10,
                            callback: function (value, index, values) {
                                let maxTicksAllowed = 10;
                                let tickGap = Math.round(values.length / maxTicksAllowed);
                                tickGap = Math.max(tickGap, 1);
                                if (index === 0) {
                                    return value;
                                }
                                if (index === (values.length - 1)) {
                                    return 'Today';
                                }

                                if (index % tickGap === 0) {
                                    return '';
                                }
                            }
                        }
                    }],
                    yAxes: [{
                        gridLines: {
                            drawTicks: false,
                            display: false
                        },
                        ticks: {
                            precision: 0,
                            padding: 6,
                            beginAtZero: true,
                            callback: function (value, index) {
                                if (index === 0) {
                                    return value;
                                }
                                return '';
                            }
                        }
                    }]
                }
            }
        };
    }
});
