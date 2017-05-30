const
    // WorkflowState = require("/Users/Swa/Desktop/Qwiery/lib/Services/Workflows/WorkflowState");
    // utils = require("/Users/Swa/Desktop/Qwiery/lib/utils");

    Qwiery = require("qwiery"),
    WorkflowState = Qwiery.WorkflowState,
    utils = Qwiery.utils,
    path = require("path"),
    _ = require("lodash");

// _ = require('lodash'),
// utils = require("../../../../utils"),
// constants = require("../../../../constants"),
// async = require('asyncawait/async'),
// waitFor = require('asyncawait/await');
class WeatherState extends WorkflowState {
    constructor(options) {
        super(options);
    }

    toList(json) {
        let r = [];
        _.forOwn(json, function(v, k) {
            r.push(`${k}: ${v}`);
        });
        return r.join(", ");
    }

    toDay(arr) {
        let r = [];
        _.forEach(arr, function(d) {
            r.push(`${d.day}: ${d.low}/${d.high} - ${d.text}`);
        });
        return "\n\n\t\t" + r.join(",\n\t\t");
    }

    execute(input) {
        const that = this;
        let ch;
        return this.workflow.services.personalization.getPersonalization("location", this.workflow.session.Context).then(function(location) {

            if(_.isNil(location)) {
                throw new Error("The 'location' has not been set for the user.");
            }
            return utils.getServiceData(
                {URL: `https://query.yahooapis.com/v1/public/yql?q=select * from weather.forecast where woeid in (select woeid from geo.places(1) where text='${location}') and u='c'&format=json&jsoncallback=json`}
            )
                .then(function(d) {
                    try {
                        ch = d.query.results.channel;
                        if(_.isNil(ch)) {
                            that.acceptMessage = "Could not fetch the weather forecast, try again a bit later.";
                        }
                        else {
                            let title = ch.title;
                            if(that.workflow.session.Format.toString().toLowerCase() === "html") {
                                let p = "/Images/weather.png";
                                let head = title.split("-")[1].trim();
                                let blob = `<img src='${p}' style='width:100px; float:right; margin:5px;'/>` +
                                    `<span style='font-size:large; color:white;'>${head}</span><br/>` +
                                    `<span style='font-size:larger; color:white;'>${ch.item.condition.text}, ${ch.item.condition.temp}ºC</span>`;
                                let c = [];
                                _.forEach(ch.item.forecast, function(d) {
                                    c.push(`<div><strong>${d.day}</strong>: ${d.low}ºC/${d.high}ºC - ${d.text}<div>`);
                                });
                                blob += `<div><span style='font-size:larger; color:white;'>Forecast</span> ${c.join("")}</div>`;
                                that.acceptMessage = '<div style="padding:5px;">' + blob + '</div>';
                            } else {
                                that.acceptMessage = {
                                    "■ title": ch.title,
                                    "■ currently": that.toList(ch.item.condition),
                                    "■ wind": that.toList(ch.wind),
                                    "■ atmosphere": that.toList(ch.atmosphere),
                                    "■ astronomy": that.toList(ch.astronomy),
                                    "■ forecast": that.toDay(ch.item.forecast)
                                };
                            }
                        }
                    }
                    catch(e) {
                        that.acceptMessage = "Could not fetch the weather forecast, try again a bit later.";
                    }
                    return that.accept(true);
                });
        });


    }

    toJSON() {
        let json = super.toJSON();
        delete json.type;
        json.path = this.path;
        return json;
    }
}
module.exports = WeatherState;