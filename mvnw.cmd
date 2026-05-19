@REM ----------------------------------------------------------------------------
@REM Licensed to the Apache Software Foundation (ASF) under one
@REM or more contributor license agreements.  See the NOTICE file
@REM distributed with this work for additional information
@REM regarding copyright ownership.  The ASF licenses this file
@REM to you under the Apache License, Version 2.0 (the
@REM "License"); you may not use this file except in compliance
@REM with the License.  You may obtain a copy of the License at
@REM
@REM    http://www.apache.org/licenses/LICENSE-2.0
@REM
@REM Unless required by applicable law or agreed to in writing,
@REM software distributed under the License is distributed on an
@REM "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
@REM KIND, either express or implied.  See the License for the
@REM specific language governing permissions and limitations
@REM under the License.
@REM ----------------------------------------------------------------------------

@IF "%__MVNW_ARG0_NAME__%"=="" (SET __MVNW_ARG0_NAME__=%~nx0)
@SET ___Maven_javaCurrentDir=%CD%
@SET ___Maven_wrapperJar="%MAVEN_PROJECTBASEDIR%\.mvn\wrapper\maven-wrapper.jar"

@SET MAVEN_PROJECTBASEDIR=%~dp0
@IF "%MAVEN_PROJECTBASEDIR:~-1%"=="\" SET MAVEN_PROJECTBASEDIR=%MAVEN_PROJECTBASEDIR:~0,-1%

@SET WRAPPER_LAUNCHER=org.apache.maven.wrapper.MavenWrapperMain

@SET DOWNLOAD_URL="https://repo.maven.apache.org/maven2/org/apache/maven/wrapper/maven-wrapper/3.2.0/maven-wrapper-3.2.0.jar"

@FOR /F "usebackq tokens=1,2 delims==" %%A IN ("%MAVEN_PROJECTBASEDIR%\.mvn\wrapper\maven-wrapper.properties") DO (
    @IF "%%A"=="wrapperUrl" SET DOWNLOAD_URL=%%B
)

@SET MVN_CMD=%JAVA_HOME%\bin\mvn.cmd
@IF EXIST "%MVN_CMD%" GOTO mvn_found_in_java_home

@FOR %%i IN (mvn.cmd) DO @SET MVN_CMD=%%~$PATH:i
@IF NOT "%MVN_CMD%"=="" GOTO mvn_found_on_path

:download_maven_wrapper
@SET MAVEN_WRAPPER_JAR=%MAVEN_PROJECTBASEDIR%\.mvn\wrapper\maven-wrapper.jar
@IF EXIST "%MAVEN_WRAPPER_JAR%" GOTO run_maven_wrapper
@echo Downloading Maven Wrapper...
@"%JAVA_HOME%\bin\java" -Dmaven.multiModuleProjectDirectory="%MAVEN_PROJECTBASEDIR%" ^
  -Dmaven.home="" ^
  -classpath "" ^
  org.apache.maven.wrapper.MavenWrapperMain ^
  %*
@GOTO end

:mvn_found_in_java_home
:mvn_found_on_path
@SET MAVEN_CMD_LINE_ARGS=%*
@"%MVN_CMD%" %MAVEN_CMD_LINE_ARGS%
@GOTO end

:run_maven_wrapper
@"%JAVA_HOME%\bin\java" ^
  -classpath "%MAVEN_WRAPPER_JAR%" ^
  "-Dmaven.multiModuleProjectDirectory=%MAVEN_PROJECTBASEDIR%" ^
  %WRAPPER_LAUNCHER% ^
  %*

:end
@IF "%MVNW_REPOURL%"=="" EXIT /B %ERRORLEVEL%
