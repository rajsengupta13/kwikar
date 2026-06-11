# ═══════════════════════════════════════════════════════════════
# Kwikar — PHP/Apache application image
#
# Mirrors the XAMPP setup this app was built for: Apache serving
# the project root, PHP with PDO MySQL, mod_rewrite for the
# .htaccess routing rules (frontend/ + /api/<name> → backend/api).
# ═══════════════════════════════════════════════════════════════
FROM php:8.2-apache

# PDO MySQL driver + common extensions used by a typical PHP/MySQL app
RUN docker-php-ext-install pdo pdo_mysql mysqli \
    && a2enmod rewrite headers expires

# Apache should serve the project root (NOT /public) because the
# root .htaccess handles routing to frontend/ and backend/api/.
ENV APACHE_DOCUMENT_ROOT=/var/www/html
RUN sed -ri -e "s!/var/www/html!${APACHE_DOCUMENT_ROOT}!g" /etc/apache2/sites-available/*.conf \
    && sed -ri -e "s!/var/www/!${APACHE_DOCUMENT_ROOT}!g" /etc/apache2/apache2.conf /etc/apache2/conf-available/*.conf

# Allow .htaccess overrides (AllowOverride All) for the routing rules to work
RUN { \
        echo '<Directory /var/www/html>'; \
        echo '    Options -Indexes +FollowSymLinks'; \
        echo '    AllowOverride All'; \
        echo '    Require all granted'; \
        echo '</Directory>'; \
    } > /etc/apache2/conf-available/kwikar-overrides.conf \
    && a2enconf kwikar-overrides

WORKDIR /var/www/html
COPY . /var/www/html

# Apache/PHP need to write to logs and data directories
RUN chown -R www-data:www-data /var/www/html/backend/logs /var/www/html/backend/data \
    && chmod -R 775 /var/www/html/backend/logs /var/www/html/backend/data

EXPOSE 80
