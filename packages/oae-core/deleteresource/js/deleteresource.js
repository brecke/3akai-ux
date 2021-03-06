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

define(['jquery', 'oae.core'], function ($, oae) {

    return function (uid) {

        // The widget container
        var $rootel = $('#' + uid);

        // Variable that will keep track of the current page context.
        // This can be a content item or a discussion item.
        var contextProfile = null;

        /**
         * Delete the current resource, show a notification message and redirect back to the me page
         */
        var deleteResource = function() {
            // Disable the delete button
            $('#deleteresource-delete', $rootel).prop('disabled', true);

            // A different API function needs to be used, depending on whether we're deleting a
            // discussion or a content item
            var deleteFunction = null;
            if (contextProfile.resourceType === 'content') {
                deleteFunction = oae.api.content.deleteContent;
            } else if (contextProfile.resourceType === 'discussion') {
                deleteFunction = oae.api.discussion.deleteDiscussion;
            } else if (contextProfile.resourceType === 'group') {
                deleteFunction = oae.api.group.deleteGroup;
            } else if (contextProfile.resourceType === 'meeting-jitsi') {
                deleteFunction = oae.api.meetingJitsi.deleteMeeting;
            }

            deleteFunction(contextProfile.id, function(err) {
                // Show a success or failure notification
                var data = {
                    'err': err,
                    'contextProfile': contextProfile
                };

                var notificationTitle = oae.api.util.template().render($('#deleteresource-notification-title-template', $rootel), data);
                var notificationBody = oae.api.util.template().render($('#deleteresource-notification-body-template', $rootel), data);
                oae.api.util.notification(notificationTitle, notificationBody, err ? 'error' : 'success');

                // If the resource was succesfully removed, we hide the modal and redirect the user
                // back to the me page after 2 seconds
                if (!err) {
                    $('#deleteresource-modal', $rootel).modal('hide');
                    setTimeout(oae.api.util.redirect().home, 2000);
                }

                // Enable the delete button
                $('#deleteresource-delete', $rootel).prop('disabled', false);
            });
        };

        /**
         * Render the appropriate labels for the modal title, body and delete button
         * based on the resource type
         */
        var setUpDeleteResource = function() {
            // Render the modal
            oae.api.util.template().render($('#deleteresource-template', $rootel), {
                'contextProfile': contextProfile
            }, $('#deleteresource-modal', $rootel));
        };

        /**
         * Initialize the delete resource modal dialog
         */
        var setUpDeleteResourceModal = function() {
            $(document).on('click', '.oae-trigger-deleteresource', function() {
                // Show the modal
                $('#deleteresource-modal', $rootel).modal({
                    'backdrop': 'static'
                });
            });

            // Bind the 'remove' button that will remove the resource
            $rootel.on('click', '#deleteresource-delete', deleteResource);

            // Receive the context information and cache it
            $(document).on('oae.context.send.deleteresource', function(ev, ctx) {
                contextProfile = ctx;
                setUpDeleteResource();
            });

            // Request the context information
            $(document).trigger('oae.context.get', 'deleteresource');
        };

        setUpDeleteResourceModal();

    };
});
