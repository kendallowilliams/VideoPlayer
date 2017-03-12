cmake_minimum_required (VERSION 2.8.11)
project (VideoPlayer)

set (CMAKE_VERBOSE_MAKEFILE ON)
set (CMAKE_CXX_FLAGS_DEBUG "-DDEBUG=true -O0 -g3 -Wall -c -fmessage-length=0")
set (CMAKE_CXX_FLAGS_RELEASE "-O3 -Wall -c -fmessage-length=0")

add_executable (get_file.cgi get_file.c)
target_link_libraries (get_file.cgi cgi.a)
target_link_libraries (get_file.cgi libmysqlclient.so)

set (CPACK_GENERATOR "DEB")
set (CPACK_PACKAGE_FILE_NAME VideoPlayer)
set (CPACK_DEBIAN_PACKAGE_MAINTAINER "Kendall O. Williams") # required
set (CPACK_DEBIAN_PACKAGE_SHLIBDEPS ON) # autogenerate dependency information
set (CPACK_PACKAGE_VERSION_MAJOR 1)
set (CPACK_PACKAGE_VERSION_MINOR 0)
set (CPACK_PACKAGE_VERSION_PATCH 0)

include(CPack)
