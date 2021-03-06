/*!
 * Copyright 2014 Apereo Foundation (AF) Licensed under the
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

define(['jquery', 'underscore', 'oae.core', 'activityadapter'], function($, _, oae, ActivityAdapter) {

    return function() {

        // The widget container. This element will be set to the notifications popover
        // container every time it is shown
        var $rootel = null;

        // Variable that will be used to keep track of the current infinite scroll instance
        var infinityScroll = false;

        /**
         * Process the incoming activities by sorting the actor entity collections on whether or not they have
         * thumbnail images, as we give preference to these for UI rendering purposes.
         *
         * @param  {Object}    data     The current user's notifications per the activitystrea.ms spec
         * @return {Object}             Object containing the notifications where the actors are sorted on whether or not they have a profile image
         */
        var processActivities = function(data) {
            var sanitization = oae.api.util.security();
            var adaptedItems = ActivityAdapter.adapt(oae.data.me.id, oae.data.me, data.items, sanitization);
            return {'results': adaptedItems};
        };

        /**
         * Based on the timestamp at which the user last read the notifications, all notifications that happened
         * after that time are marked as unread. This will make it clearer to the end-user as to which notifications
         * he should be paying most attention to.
         */
        var flagUnread = function() {
            // Remove the unread style from all items
            $('.oae-listitem', $rootel).removeClass('alert-info');
            // Add the unread style to all items that happened after the last time the notifications
            // were read by the user
            var notificationsLastRead = oae.data.me.notificationsLastRead || 0;
            $('.oae-list > li', $rootel).each(function() {
                var $notification = $(this);
                if (parseInt($notification.attr('data-published'), 10) > notificationsLastRead) {
                    // The standard `alert-info` class is used for flagging
                    $notification.find('.oae-listitem').addClass('alert-info');
                }
            });
        };

        /**
         * When the clickover is closed, we assume that the user has seen all of its unread notifications and mark
         * all of them as read.
         */
        var markAsRead = function() {
            // Reset the aggregator process for the notification stream. This will cause new
            // activities to roll in as new rows in the view
            oae.api.push.resetAggregation(oae.data.me.id, 'notification');

            // Reset the number of unread notifications on the back-end side
            $.ajax({
                'url': '/api/notifications/markRead',
                'type': 'POST'
            });
        };

        /**
         * Remove the unread notification count from the top navigation widget
         */
        var removeUnreadCount = function() {
            // Clear the notification count value
            $('#topnavigation-notification-count').text('');

            // Reset the number of unread notifications in the me feed object and
            // the time at which the notifications were read last
            oae.data.me.notificationsLastRead = Date.now();
            oae.data.me.notificationsUnread = 0;
            // Reset the favicon bubble
            oae.api.util.favicon().setBubble(0);
        };

        /**
         * Initialize a new infinite scroll container that fetches the current user's notifications.
         */
        var getNotifications = function() {
            // Disable the previous infinite scroll
            if (infinityScroll) {
                infinityScroll.kill();
            }

            // Set up the infinite scroll for the notifications list
            infinityScroll = $('.oae-list', $rootel).infiniteScroll('/api/notifications', {
                'limit': 6
            }, '#notifications-template', {
                'scrollContainer': $('#notifications-container', $rootel),
                'postProcessor': processActivities,
                'postRenderer': flagUnread,
                'emptyListProcessor': handleEmptyResultList
            });
        };

        /**
         * Show the empty list message when no notifications are found. This function will
         * be called by the infinite scroll plugin.
         */
        var handleEmptyResultList = function() {
            // Apply a specialized template for when there are no notifications
            oae.api.util.template().render($('#notifications-noresults-template', $rootel), null, $('.oae-list', $rootel));
        };

        /**
         * Subscribe to notification push notifications, allowing for new notifications to be added to the
         * notification stream straight away
         */
        var setUpPushNotifications = function() {
            oae.api.push.subscribe(oae.data.me.id, 'notification', oae.data.me.signature, 'activitystreams', true, true, function(activities) {
                // Prepend the new notification to the notification stream
                infinityScroll.prependItems({'items': activities});


                // The new notifications are marked as read when the notification popover is visible,
                // and therefore the new notification will have been seen by the user
                if ($rootel.is(':visible')) {
                    markAsRead();
                }
            });
        };

        /**
         * Initializes the notifications clickover
         */
        var setUpNotificationsClickover = function() {
            $(document).on('click', '.oae-trigger-notifications', function() {
                // Trigger the notifications clickover
                oae.api.util.clickover($(this), $('.notifications-widget'), {
                    'container': '#topnavigation-notifications-container',
                    'onHidden': removeUnreadCount,
                    'onShown': function($currentRootEl) {
                        $rootel = $currentRootEl;
                        getNotifications();
                        // The notifications need to be marked as read straight away, in case the user
                        // follows a link in the notifications and doesn't actually end up closing the
                        // clickover on the current page
                        markAsRead();
                    },
                    'tip_id': 'notifications-popover'
                });
            });
        };

        setUpPushNotifications();
        setUpNotificationsClickover();

    };
});
