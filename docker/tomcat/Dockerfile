# Dockerfile para Apache Tomcat (Servicio de Reportes de Impresión / JasperReports)
FROM tomcat:9.0.123-jdk25-temurin-noble

# Habilitar aplicaciones por defecto de Tomcat si es necesario
RUN cp -r /usr/local/tomcat/webapps.dist/* /usr/local/tomcat/webapps/ || true

EXPOSE 8080

CMD ["catalina.sh", "run"]
