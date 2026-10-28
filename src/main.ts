import './styles.css';
import { createWebPlatform } from './platform/platform.ts';
import { startApp } from './ui/app.ts';

startApp(createWebPlatform());
