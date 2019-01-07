/*!
 * Copyright 2018 Apereo Foundation (AF) Licensed under the
 * Educational Community License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License. You may
 * obtain a copy of the License at
 *
 *     http://opensource.org/licenses/ECL-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an "AS IS"
 * BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express
 * or implied. See the License for the specific language governing
 * permissions and limitations under the License.
 */

define(['jquery', 'underscore', 'oae.core'], function($, _, oae) {
  return function() {
    // The cookie name
    var cookieName = 'breadcrumb';

    /**
     * Update the breadcrumb
     */
    var updateBreadcrumb = function(widgetData, callback) {
      var location = $.url(encodeURI(window.location.href));
      var host = location.attr('host');
      var dotDomain = '.'.concat(
        host
          .split('.')
          .slice(1)
          .join('.')
      );
      var breadcrumbLocation = location.data.attr.source;
      var breadcrumb = [];

      // If the user is to his home page, reset the breadcrumb
      if (widgetData === oae.data.me) {
        docCookies.setItem(cookieName, JSON.stringify(''), null, '/', dotDomain);
        breadcrumb.push({ name: 'Home', location: '/' });
        docCookies.setItem(cookieName, JSON.stringify(breadcrumb), null, '/', dotDomain);
        callback();
      } else {
        if (docCookies.getItem(cookieName)) {
          breadcrumb = $.parseJSON(docCookies.getItem(cookieName));

          // If the page is already on the breadcrumb, remove all pages after the one
          // That means that the user has gone back
          if (
            !_.isEmpty(
              _.filter(breadcrumb, function(page) {
                return page.location == breadcrumbLocation;
              })
            )
          ) {
            var indexOfActualLocation = breadcrumb
              .map(function(page) {
                return page.location;
              })
              .indexOf(breadcrumbLocation);
            var newBreadcrumb = breadcrumb.splice(0, indexOfActualLocation + 1);
            docCookies.setItem(cookieName, JSON.stringify(newBreadcrumb), null, '/', dotDomain);
            callback();

            // The user has visited another page, add this page to the breadcrumb
          } else {
            breadcrumb.push({ name: widgetData.displayName, location: breadcrumbLocation });
            docCookies.setItem(cookieName, JSON.stringify(breadcrumb), null, '/', dotDomain);
            callback();
          }

          // If the breadcrumb don't exist, initialize the variable and add the current page
        } else {
          breadcrumb = [{ name: widgetData.displayName, location: breadcrumbLocation }];
          docCookies.setItem(cookieName, JSON.stringify(breadcrumb), null, '/', dotDomain);
          callback();
        }
      }
    };

    /**
     * Create the html element
     */
    var drawBreadcrumb = function(callback) {
      var breadcrumb = $.parseJSON(docCookies.getItem(cookieName));
      var list = $('<ul id="breadcrumb-list"> </ul>');

      list.append(
        '<li id="breadcrumb-title">' + oae.api.i18n.translate('__MSG__YOU_ARE_HERE__') + '</li>'
      );

      _.each(breadcrumb, function(item, key) {
        if (item.name && key + 1 != Object.keys(breadcrumb).length) {
          list.append('<li> <a href="' + item.location + '">' + item.name + '</a> <li>');

          // Don't display the last/actual element as a link
        } else if (item.name && key + 1 === Object.keys(breadcrumb).length) {
          list.append('<li>' + item.name + '<li>');
        }
      });

      return callback(null, list);
    };

    /**
     * Insert the html element to the page
     */
    var insertBreadcrumbIntoPage = function(component) {
      $('.oae-main-content').before(component);
      $('#breadcrumb-list li:empty').remove();
    };

    /**
     * Catches the event on `oae-trigger-breadcrumb`
     */
    $(document).on('oae.trigger.breadcrumb', function(ev, widgetData) {
      updateBreadcrumb(widgetData, function() {
        drawBreadcrumb(function(err, component) {
          insertBreadcrumbIntoPage(component);
        });
      });
    });
  };
});
