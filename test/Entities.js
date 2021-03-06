const
    _ = require("lodash");
const
    Entities = require("../lib/Understanding/Entities");
exports.Appointment = function(test) {

    let e = Entities.parse({
        DataType: "Appointment"
    });
    test.ok(e instanceof Entities.Appointment);
    test.equal(e.From, null);
    test.equal(e.To, null);
    test.ok(!e.AllDay);

    e = Entities.parse({
        DataType: "Appointment",
        From: "Today",
        To: "Tomorrow",
        Id: "S",
        AllDay: true
    });
    test.ok(e instanceof Entities.Appointment);
    test.ok(_.isNumber(e.To));
    test.ok(_.isNumber(e.From));
    const f = new Date(e.From);
    const t = new Date(e.To);
    const today = new Date();
    let tomorrow = new Date();
    tomorrow.setDate(new Date().getDate() + 1);
    test.equal(f.getDate(), today.getDate());
    test.equal(t.getDate(), tomorrow.getDate());
    test.ok(e.AllDay);
    test.equal(e.Id, "S");
    test.done();
};
