#!/bin/bash

cp ./modbus.service /lib/systemd/system
sudo systemctl daemon-reload
sudo systemctl enable modbus.service

