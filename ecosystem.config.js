module.exports = {
  apps: [
    {
      name: 'app',
      script: './dist/main.js',
      instances: 1,
      autostart: true,
      watch: false,
      max_memory_restart: '500M',
    },
  ],
};
