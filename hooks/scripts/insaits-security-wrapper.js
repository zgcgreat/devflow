#!/usr/bin/env node
/**
 * InsAIts Security Monitor — 别名入口。
 *
 * 历史上此文件与 security-scan.js 是逐字节相同的复制粘贴副本，双源必然漂移。
 * 现统一为单一实现：security-scan.js（其 stdin 处理在模块加载时执行，
 * require 即完成委托），本文件仅保留为兼容旧注册路径的别名。
 */

'use strict';

require('./security-scan');
