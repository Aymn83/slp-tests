// إعداد PM2 لتشغيل موقع الاختبارات (myskills.lt) كعملية مستقلة عن براعم
// التشغيل:  pm2 start deploy/ecosystem.config.js  ثم  pm2 save
module.exports = {
  apps: [
    {
      name: "slp-tests",
      cwd: "/var/www/slp-tests",
      script: "node_modules/next/dist/bin/next",
      args: "start -p 3200",
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      max_memory_restart: "500M",
      env: {
        NODE_ENV: "production",
        PORT: "3200",
      },
    },
  ],
};
