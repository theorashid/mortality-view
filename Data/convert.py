#!/usr/bin/env python3

import collections
import csv
import json

def floatify(v):
  return round(float(v), 1)

data = collections.defaultdict(list)

with open('MSOAe0.csv', newline='') as csvfile:
  rows = csv.DictReader(csvfile)
  for row in rows:
    current = data[row['MSOA2011']]
    if not current:
      current.append(row['MSOA'])
      current.append(row['LAD2020NM'])
      current.append(row['GOR2011NM'])
      current.append([{}, {}])
    current_data = [floatify(row[column]) for column in ('e0med', 'e0ci95low', 'e0ci95upp')]
    current[-1][1 if row['sex'] == 'female' else 0][int(row['YEAR'])] = current_data

with open('MSOAe0.json', 'w') as out:
  json.dump(data, out, separators=(',', ':'))

print('Done.')

