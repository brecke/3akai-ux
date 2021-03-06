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

define(['jquery', 'underscore', 'oae.core'], function($, _, oae) {

    return function(uid, showSettings) {

        // The widget container
        var $rootel = $('#' + uid);

        // Array that will keep track of the groups that need to be left
        var groupsToLeave = null;

        /**
         * Renders the list of groups to leave
         */
        var renderGroupList = function() {
            oae.api.util.template().render($('#leavegroup-list-template', $rootel), {
                'groups': groupsToLeave,
                'displayOptions': {
                    'metadata': false
                }
            }, $('#leavegroup-modal-content', $rootel));

            // Hide the spinner icons using jQuery
            // @see https://github.com/FortAwesome/Font-Awesome/issues/729
            $('.fa-spinner', $rootel).hide();
        };

        /**
         * Leave the selected groups and show success/failure messages
         */
        var leaveGroups = function() {
            var done = 0;
            var toDo = groupsToLeave.length;
            var errCount = 0;

            // Lock the modal
            $('#leavegroup-modal', $rootel).modal('lock');
            // Disable form elements to prevent repeat clicks
            $('button, input', $rootel).prop('disabled', true);

            /**
             * Leave a single groups and calls itsself when not done or finishes the
             * leaving process by calling `finishLeaveGroup` and passing in the error count
             *
             * @param  {String}    groupId    The ID of the group to leave
             */
            var leaveGroup = function(groupId) {
                var $listItem = $('ul li[data-id="' + groupId + '"]', $rootel);
                var $spinner = $listItem.find('.fa-spinner');
                var $ok = $listItem.find('.fa-check');
                var $warning = $listItem.find('.fa-exclamation-triangle');

                // Show the progress indicator
                $spinner.show();

                // Leave the group
                oae.api.group.leaveGroup(groupId, function(err, data) {
                    // Hide the progress indicator
                    $spinner.hide();
                    if (err) {
                        // If there is an error, show the warning icon
                        $warning.show();
                        errCount++;
                    } else {
                        // If there is no error, show the success icon
                        $ok.show();
                    }

                    done++;
                    // If not all groups have been handled, leave the next group
                    if (done !== toDo) {
                        leaveGroup(groupsToLeave[done].id);
                    // If all groups have been handled show a notification and close
                    // the modal if all groups have been left successfully.
                    } else {
                        finishLeaveGroup(errCount);
                    }
                });
            };

            // Leave the first group
            leaveGroup(groupsToLeave[0].id);
        };

        /**
         * Finish the leave group process by showing an appropriate notification, hiding the modal and
         * sending out an `oae.leavegroup.done` event
         *
         * @param  {Number}         errCount        The number of groups that couldn't be left
         */
        var finishLeaveGroup = function(errCount) {
            // Show a success or failure notification
            var resultData = {
                'errCount': errCount,
                'groups': groupsToLeave
            };
            var notificationTitle = oae.api.util.template().render($('#leavegroup-notification-title-template', $rootel), resultData);
            var notificationBody = oae.api.util.template().render($('#leavegroup-notification-body-template', $rootel), resultData);
            oae.api.util.notification(notificationTitle, notificationBody, errCount ? 'error' : 'success');

            // Refresh the memberships list
            $(document).trigger('oae.leavegroup.done');

            // Deselect all list items and disable list option buttons
            $(document).trigger('oae.list.deselectall');

            // Unlock the modal
            $('#leavegroup-modal', $rootel).modal('unlock');

            // If no errors occurred, close the modal
            if (errCount === 0) {
                $('#leavegroup-modal', $rootel).modal('hide');
            }
        };

        /**
         * Initializes the leavegroup modal dialog
         */
        var setUpLeaveGroupModal = function() {
            $(document).on('click', '.oae-trigger-leavegroup', function(ev) {
                // Show the modal
                $('#leavegroup-modal', $rootel).modal({
                    'backdrop': 'static'
                });

                // Enable the form elements
                $('button, input', $rootel).prop('disabled', false);

                // Request the context information
                $(document).trigger('oae.list.getSelection', 'leavegroup');
            });

            // Listen to the event that returns the list of selected groups
            $(document).on('oae.list.sendSelection.leavegroup', function(ev, data) {
                groupsToLeave = data.results;
                renderGroupList();
            });

            // Binds the 'leave group' button that will leave the selected groups
            $rootel.on('click', '#leavegroup-leave', leaveGroups);
        };

        setUpLeaveGroupModal();

    };
});
