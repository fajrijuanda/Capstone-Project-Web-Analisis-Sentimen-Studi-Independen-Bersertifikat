# -*- encoding: utf-8 -*-
import multiprocessing

bind = '0.0.0.0:8000'
workers = multiprocessing.cpu_count() * 2 + 1
threads = 4
timeout = 120
accesslog = '-'
loglevel = 'debug'
capture_output = True
enable_stdio_inheritance = True
