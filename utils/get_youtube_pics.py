#!/usr/bin/env python3
import json
import os
import re
import sys

if len(sys.argv) > 1:
    file_path = sys.argv[1]
    if not os.path.exists(file_path):
        print("File does not exist.")
        exit(66)

    records_changed = 0

    with open(file_path, 'r') as json_file:
        try:
            records = json.load(json_file)
        except ValueError as e:
            print('Invalid json: %s' % e)
            exit(65)

        for record in records:
            if not record['img'] or record['img'] == '':
                if "youtube.com" in record['url']:
                    ytid = re.findall('v=(.+?)($|&)', record['url'])
                    if ytid is not None and len(ytid) > 0 and len(ytid[0]) > 0 and len(ytid[0][0]) > 0:
                        record['img'] = "https://i.ytimg.com/vi/%s/maxresdefault.jpg" % ytid[0][0]
                        records_changed += 1
                    else:
                        print("Errorneous video url", record['url'])
                        print("Fix parser?")
        json_file.close()

    if records_changed:
        with open(file_path, 'w') as json_file:
            json.dump(records, json_file)
            json_file.close()

        print("Commited", records_changed, "changes.")
    else:
        print("No changes were made.")
