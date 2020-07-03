module.exports = {
  apps : [{
    name: 'covid-scraper',
    script: 'pushscript.py',
    watch: '.',
    restart_delay: 86400000,
    interpreter: 'C:\\Python38\\python.exe'
  }]
};
