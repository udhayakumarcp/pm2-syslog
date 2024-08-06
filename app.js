const pmx = require("pmx");
const pm2 = require("pm2");
const SysLogger = require("ain2");

pmx.initModule({}, (err, conf) => {
  if (err) {
    console.error("Failed to initialize pmx module:", err);
    return;
  }

  try {
    const logger = new SysLogger({
      tag: "pm2",
      facility: "user",
      path: "/dev/log",
      port: 514,
    });

    pm2.launchBus((err, bus) => {
      if (err) {
        console.error("Failed to launch PM2 bus:", err);
        return;
      }

      bus.on("*", (event, data) => {
        if (event === "process:event") {
          logger.warn({
            app: "pm2",
            target_app: data.process.name,
            target_id: data.process.pm_id,
            restart_count: data.process.restart_time,
            status: data.event,
          });
        }
      });

      bus.on("log:err", (data) => {
        logger.error({
          app_name: data.process.name,
          id: data.process.pm_id,
          message: data.data,
        });
      });

      bus.on("log:out", (data) => {
        logger.log({
          app: data.process.name,
          id: data.process.pm_id,
          message: data.data,
        });
      });
    });
  } catch (error) {
    console.error("An error occurred:", error);
  }
});
