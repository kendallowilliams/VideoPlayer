/* 
 * File:   get_file_v5.c
 * Author: Kendall O. Williams
 *
 * Created on February 6, 2014, 10:11 AM
 * 
 * Notes: get_file_v4.cgi cleaned up.
 */

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <cgi.h>
#include <mysql/mysql.h>
#include <time.h>

#define BUFF_LENGTH     256
#define MAX_LOG_SIZE    512000  // limit file size to 512KB; may change
#define LOG_PATH        "/STORAGE/online_video/logs/"

typedef enum { FALSE, TRUE } BOOLEAN;

size_t get_size(FILE*);
void print_file(FILE*,size_t,size_t);
void print_header(size_t, size_t, size_t, BOOLEAN);
int get_range(char*,size_t*,size_t*);
void print_content_range(size_t,size_t,size_t);
int get_path(char*,char**);
int write_to_log();

int main(int argc, char** argv) 
{
    s_cgi *cgi = NULL;
    char *path = NULL,
         *log_path = "log.txt",
         *range = NULL,
         *query = NULL,
         *method = NULL,
         *address = NULL;
    FILE *file = NULL,
         *log_file = NULL;
    size_t size = 0,
         first = 0,
         last = 0;
    
    if ((method = getenv("REQUEST_METHOD")) == NULL) /*then*/ method = "UNKNOWN";
    if ((address = getenv("REMOTE_ADDR")) == NULL) /*then*/ address = "UNKNOWN";
    if ((query = getenv("QUERY_STRING")) == NULL) /*then*/ query = "UNKNOWN";
    
    range = getenv("HTTP_RANGE");
    cgi = cgiInit();
    get_path(cgiGetValue(cgi, "id"), &path);
    //sprintf(log_path, "%s%s", LOG_PATH, "log.txt");
    
    if (path != NULL)
    {
        file = fopen(path, "rb");
        size = get_size(file);
        last = size - 1;         /* default */

        if (range != NULL)
        {
            //log_file = fopen(log_path, "a+");
            //fprintf(log_file, "File: %s, Method: %s, Address: %s, Query-String: %s, Range: %s\n", path, method, address, query, range);
            get_range(range, &first, &last);
            print_header(size, first, last, TRUE);
            //fclose(log_file);
        }
        else
        {
            print_header(size, first, last, FALSE);
        }
        print_file(file, first, last);
        free(path);
        fclose(file);
    }
    else
    {
        puts("Status: 204 No Content");
        puts("");
    }
    if (cgi) /*then*/ cgiFree(cgi);
    return (EXIT_SUCCESS);
}

void print_file(FILE *file, size_t first, size_t last)
{
    size_t length = last - first + 1;
    unsigned char str[BUFF_LENGTH];
    fseek(file, first, SEEK_SET);
    
    while (BUFF_LENGTH < length)
    {
        fread(str, sizeof(char), BUFF_LENGTH, file);
        fwrite(str, sizeof(char), BUFF_LENGTH, stdout);
        length -= BUFF_LENGTH;
    }
    
    if (length > 0)
    {
        fread(str, sizeof(char), length, file);
        fwrite(str, sizeof(char), length, stdout);
        length = 0;
    }
}

size_t get_size(FILE *file)
{
    size_t size = 0;
    fseek(file, 0, SEEK_END);
    size = ftell(file);
    fseek(file, 0, SEEK_SET);
    return size;
}

void print_header(size_t size, size_t first, size_t last, BOOLEAN hasRange)
{
    if (hasRange)
    {
        puts("Status: 206 Partial Content");
        print_content_range(size, first, last);
        printf("Content-Length: %ld\n", last - first + 1);
    }
    else
    {
        puts("Status: 200 OK");   
        printf("Content-Length: %ld\n", size);
    }
    puts("Accept-Ranges: bytes");
    puts("Content-Type: video/mp4");
    puts("");
}

int get_range(char *value, size_t *first, size_t *last)
{
    int status = 0;
    char *str1, *str2 = NULL;
    str1 = strtok(value, "=");
    str1 = strtok(NULL, "=");
    str2 = strtok(str1, "-");
    *first = atol(str2);
    str2 = strtok(NULL, "-");
    if (str2 != NULL)
    {
        *last = atol(str2);
    }
    return status;
}

void print_content_range(size_t size, size_t first, size_t last)
{
    printf("Content-Range: bytes %ld-%ld/%ld\n", first, last, size);
}

int get_path(char *id, char **path)
{
    char query[256], *str = NULL;
    int status = 0;
    MYSQL *conn = NULL;
    MYSQL_RES *result = NULL;
    MYSQL_ROW row;
    
    if (id != NULL)
    {
        str = (char*)malloc(sizeof(char) * 256);
        conn = mysql_init(NULL);
        char *format = "SELECT episode.filename, series.root, season.root FROM `episode` "
                       "LEFT JOIN `series` ON series.id=episode.series_id LEFT JOIN `season` "
                       "ON season.id=episode.season_id WHERE episode.id=%s";
        sprintf(query, format, id);
        mysql_real_connect(conn, "localhost", "kow", "kow", "video_player", 0, "/var/run/mysqld/mysqld.sock", 0); 
        mysql_query(conn, query);
        result = mysql_store_result(conn);
        row = mysql_fetch_row(result);
        memset(str, '\0', 256);
        sprintf(str, "/STORAGE/online_video/%s/%s/%s", row[1], row[2], row[0]);
        mysql_close(conn);
        *path = str;
    }
    
    return status;
}
