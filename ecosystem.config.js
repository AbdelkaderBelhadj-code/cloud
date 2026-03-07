module.exports = {
    apps: [
        {
            name: 'license-mgmt-backend',
            script: './backend/app.js',
            cwd: './',
            instances: 'max',
            exec_mode: 'cluster',
            env: {
                NODE_ENV: 'production',
                PORT: 5000,
            },
            env_production: {
                NODE_ENV: 'production',
            },
            watch: false,
            max_memory_restart: '500M',
            error_file: './logs/pm2-error.log',
            out_file: './logs/pm2-out.log',
            log_date_format: 'YYYY-MM-DD HH:mm:ss',
            autorestart: true,
            restart_delay: 5000,
        },
    ],
};
