#!/bin/bash

#---------------VARIABLES-------------
IFS="&"
results=""
user="kow"
pwd="kow"
dbase="video_player"
options='-X'
query=""
series=-1
season=-1
type=""

#---------------MAIN------------------

read -a list <<< "$QUERY_STRING"
IFS="="

for element in "${list[@]}"
do
	read -a pair <<< "$element"

	if [ "${pair[0]}" == "type" ]
		then
		type="${pair[1]}"
	fi

	if [ "${pair[0]}" == "series" ]
		then
		series="${pair[1]}"
	fi

	if [ "${pair[0]}" == "season" ]
		then
		season="${pair[1]}"
	fi
done

if [ "$type" == "series" ]
	then
	query="SELECT * FROM series"
elif [ "$type" == "season" ]
	then
	query="SELECT * FROM season"
elif [ "$type" == "episode" ]
	then
	query="SELECT * FROM episode WHERE series_id=${series} AND season_id=${season}"
fi

results=$(mysql $options -D$dbase -e"$query")

#---------------START-OF-OUTPUT-------------
#echo "Access-Control-Allow-Origin: *"
#echo "Access-Control-Allow-Methods: POST, GET, OPTIONS, PUT, DELETE, HEAD"
#echo "Access-Control-Allow-Headers: X-PINGOTHER, Origin, X-Requested-With, Content-Type, Accept"
#echo "Access-Control-Max-Age: 1728000"
echo "Content-Type: text/xml"
echo "Cache-Control: no-cache, no-store, must-revalidate"
echo "Pragma: no-cache"
echo "Expires: 0"
echo ""

#echo "$QUERY_STRING"
echo "$results"
#echo "$type"
#echo "$series"
#echo "$season"
#echo "$query"
#---------------END-OF-OUTPUT---------------
