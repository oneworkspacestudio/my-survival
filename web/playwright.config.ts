import {defineConfig} from '@playwright/test';
export default defineConfig({testDir:'./e2e',workers:1,timeout:60000,use:{channel:'chrome',headless:true,baseURL:'http://127.0.0.1:5418',actionTimeout:12000},outputDir:'test-results',reporter:'list',webServer:{command:'node scripts/serve.mjs',url:'http://127.0.0.1:5418',reuseExistingServer:false,timeout:30000}});
