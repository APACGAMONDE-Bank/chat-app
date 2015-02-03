var config = {};

// server settings
config.PORT = 3000;
config.LOG4JS_CONFIG = {
    "appenders": [
        {
            "category": "dev",
            "type": "console",
            "layout": {
                "type": "pattern",
                "pattern": "[%d{yyyy-MM-dd hh:mm:ss}]%[[%p]%] %m"
            }
        },
        { 
            "category": "prod",
            "type": "file", 
            "filename": "logs/server.log", 
            "maxLogSize": 20480,
            "backups": 5,
            "layout": { 
                "type": "pattern",
                "pattern": "[%d{yyyy-MM-dd hh:mm:ss}]%[[%p]%] %m"
            }
        }
    ],
    "levels": {
        "[all]": "INFO",
        "dev":  "DEBUG",
        "prod": "ERROR"
    }
};

// app settings
config.MAX_USERS = 20;

module.exports = config;
