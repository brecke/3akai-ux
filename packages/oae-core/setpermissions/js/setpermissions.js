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

define(['jquery', 'oae.core'], function($, oae) {

    /*!
     * This widget will be initiated with a widgetData object that contains the following properties:
     *
     * @param  {Number}     count               The number of items that have been prepared to add into the system
     * @param  {Object[]}   ghosts              Ghost items that should be added to the autosuggest share field upon initialization
     * @param  {Bookean}    ghosts[i].selected  Whether or not the ghost item should be selected by default
     * @param  {Object[]}   preFill             Items that should be pre-filled into the autosuggest share field upon initialization
     * @param  {Bookean}    preFill[i].fixed    Whether or not the pre-filled item should be undeleteable from the share list
     * @param  {String}     type                The type of item that will be added to the system (one of `file`, `link`, `collabdoc`, `collabsheet` or `folder`)
     * @param  {String}     visibility          The default visibility for the items that are being added to the system (one of `public`, `loggedin` or `private`)
     */
    return function(uid, showSettings, widgetData) {
        
        // The widget container
        var $rootel = $('#' + uid);

        // Caches the member updates that need to be applied. Each key is a
        // member (user or group) id and its value is the role for that member.
        var currentMembers = {};

        // Caches the member the invite. Each key is a member (user or group) 
        // email and its value is the role for that member.
        var currentInvitations = {};

        // Variable that keeps track of the current page context, as this will be used as a default
        // user/group that the item will be shared with
        var pageContext = null;

        // Caches the visibility of the context (e.g. group/content/discussion/...)
        var visibility = null;

        // Variable that will be used to keep track of the current infinite scroll instance
        var infinityScroll = null;

        // Declare all possible roles for each resourses
        var roles = {'collabdoc': [
                {'id': 'viewer', 'name': oae.api.i18n.translate('__MSG__CAN_VIEW__')},
                {'id': 'editor', 'name': oae.api.i18n.translate('__MSG__CAN_EDIT__')},
                {'id': 'manager', 'name': oae.api.i18n.translate('__MSG__CAN_MANAGE__')}
            ], 'link': [
                {'id': 'viewer', 'name': oae.api.i18n.translate('__MSG__CAN_VIEW__')},
                {'id': 'manager', 'name': oae.api.i18n.translate('__MSG__CAN_MANAGE__')}
            ], 'upload': [
                {'id': 'viewer', 'name': oae.api.i18n.translate('__MSG__CAN_VIEW__')},
                {'id': 'manager', 'name': oae.api.i18n.translate('__MSG__CAN_MANAGE__')}
            ], 'file' : [
                {'id': 'viewer', 'name': oae.api.i18n.translate('__MSG__CAN_VIEW__')},
                {'id': 'manager', 'name': oae.api.i18n.translate('__MSG__CAN_MANAGE__')}
            ], 'discussion' : [
                {'id': 'viewer', 'name': oae.api.i18n.translate('__MSG__CAN_VIEW__')},
                {'id': 'manager', 'name': oae.api.i18n.translate('__MSG__CAN_MANAGE__')}
            ], 'folder' : [
                {'id': 'viewer', 'name': oae.api.i18n.translate('__MSG__CAN_VIEW__')},
                {'id': 'manager', 'name': oae.api.i18n.translate('__MSG__CAN_MANAGE__')}
            ], 'meeting-jitsi' : [
                {'id': 'viewer', 'name': oae.api.i18n.translate('__MSG__CAN_VIEW__')},
                {'id': 'manager', 'name': oae.api.i18n.translate('__MSG__CAN_MANAGE__')}
            ]};


        ////////////////////////////
        //        ACTIONS         //
        ////////////////////////////

        /**
         * Trigger an event when changes have been made to the members settings
         */
        var saveMembersChange = function() {

            // Get members from the autosuggest selection
            var membersPartition = _.partition(getAutosuggestSelection(), function(member) {
                return (member.profile.resourceType === 'email');
            });

            var newInvitations = membersPartition[0];
            var newMembers = membersPartition[1];
            var invitationsUpdates = {};

            // Keep track of all members updates
            _.each(newMembers, function(newMember) {
                currentMembers[newMember.profile.id] = newMember.role;
            });

            // Keep track of all invitations updates
            _.each(newInvitations, function(newInvitation) {
                invitationsUpdates[newInvitation.profile.id] = newInvitation.role;
            });

            // Update the invitations list
            if (!_.isEmpty(newInvitations)) {
                updateInvitations(invitationsUpdates);
            }

            // Update the members infinite scroll 
            var newMembers = _.map(newMembers, function(member) { 
                member.profile.role = member.role;
                return member.profile; 
            });

            // Add members to the permissions modal list
            _.each(newMembers, function(newMember) {
                infinityScroll.prependItems(newMember);
            });

            // Inform the widget caller that the member/invitation list have changed
            $(document).trigger('oae.setpermissions.changed.' + uid, {
                'members': currentMembers,
                'invitations': currentInvitations
            });
        };

        /**
         * Fire an event to let the widget caller know that the members change has been aborted
         */
        var cancelShareChange = function() {
            $(document).trigger('oae.setpermissions.cancel.' + uid);
        };

        /**
         * Trigger an event when changes have been made to the visibility settings
         */
        var saveVisibilityChange = function() {

            // Get the selected visibility setting
            visibility = $('#setpermissions-visibility input[type="radio"]:checked', $rootel).val();

            // Inform the widget caller that the permissions have changed
            $(document).trigger('oae.setpermissions.changed.' + uid, {
                'visibility': visibility
            });

            // Change icone visibility on the permission modal
            $('#setpermissions-overview-visibility-container i').attr('class', 'fa fa-oae-' + visibility + ' pull-left');

            // Change text visibility on the permission modal
            if (visibility === 'private') {
                $('#setpermissions-overview-visibility-container span').html(oae.api.i18n.translate('__MSG__PRIVATE__'));
            } else if (visibility === 'loggedin') {
                $('#setpermissions-overview-visibility-container span').html(widgetData.oae.data.me.tenant.displayName);
            } else {
                $('#setpermissions-overview-visibility-container span').html(oae.api.i18n.translate('__MSG__PUBLIC__'));
            }

            // Inform the widget caller that visibility have changed
            $(document).trigger('oae.setpermissions.changed.' + uid, {
                'visibility': visibility
            });
        };

        /**
         * Fire an event to let the widget caller know that the permission change has been aborted
         */
        var cancelPermissionsChange = function() {
            $(document).trigger('oae.setpermissions.cancel.' + uid);
        };

        /**
         * Get the folder's members if the resource is inside of a folder
         *
         * @param  {String}         folderId                    The folder id
         * @param  {Function}       callback                    Standard callback function
         */
        var getFolderMembers = function(folderId, callback) {

            if (oae.data.me.id === folderId) {
                return callback(null, []);
            }

            // Get all members
            oae.api.folder.getMembers(folderId, null, null, function(err, members) {
                if (err) {
                    return callback(err);
                };

                // Get out the creator of the resource 
                var folderMembers = _.chain(members.results)
                    .map(function(member) { member.profile.role = member.role; return member.profile; })
                    .reject(function(member) { return member.id === widgetData.oae.data.me.id; })
                    .value();

                if (_.isEmpty(folderMembers)) {
                    return callback(null, []);
                } else {
                    return callback(null, folderMembers);
                }
            });
        };

        /**
         * Remove a member from the member list.
         */
        var deleteMember = function() {

            var memberId = $(this).attr('data-id');

            // Remove members from the list
            if (oae.api.util.validation().isValidEmail(memberId)) {
                delete currentInvitations[memberId];
                currentInvitations = _.reject(currentInvitations, function(member) { return member.id == memberId; });

                // If there is no more pending invitations, hide the list
                if (_.isEmpty(currentInvitations)) {
                    currentInvitations = {};
                    $('#setpermissions-overview-invitations').hide();
                } 

                updateInvitations();

            } else {
                // Remove members to the permissions modal list
                infinityScroll.removeItems(memberId);
                delete currentMembers[memberId];

                // Inform the widget caller that the member list have changed
                $(document).trigger('oae.setpermissions.changed.' + uid, {
                    'members': currentMembers
                });
            }
        };

        /**
         * Update the role of a member. This will only be persisted when the `Save` button is clicked.
         */
        var updateRole = function() {
            var memberId = $(this).attr('data-id');
            var selectedRole = $(this).val();

            if (oae.api.util.validation().isValidEmail(memberId)) {
                currentInvitations[memberId] = selectedRole;
                
                // Inform the widget caller that the invitation list have changed
                $(document).trigger('oae.setpermissions.changed.' + uid, {
                    'invitations': currentInvitations
                });

            } else {
                currentMembers[memberId] = selectedRole;

                // Inform the widget caller that the member list have changed
                $(document).trigger('oae.setpermissions.changed.' + uid, {
                    'members': currentMembers,
                });
            }
        };

        /**
         * Update the invitations from the current invitation role state
         */
        var updateInvitations = function(invitationsUpdates) {
            _.each(invitationsUpdates, function(newInvitationRole, newInvitationEmail) {
                currentInvitations[newInvitationEmail] = createMemberProfileForEmail(newInvitationEmail, newInvitationRole);
            });

            if (_.isEmpty(currentInvitations)) {
                $('#setpermissions-overview-invitations').hide();
            } else {
                $('#setpermissions-overview-invitations').show();
                oae.api.util.template().render($('#setpermissions-overview-selected-template'), {
                    'creator': widgetData.oae.data.me.id,
                    'results': currentInvitations,
                    'roles': roles[widgetData.type],
                    'displayOptions': {
                        'metadata': false
                    }
                }, $('#setpermissions-overview-selected-invitations-container'));
            }

            // Inform the widget caller that the invitation list have changed
            $(document).trigger('oae.setpermissions.changed.' + uid, {
                'invitations': currentInvitations
            });
        };

        /**
         * Given an email and a role, create a standard resource member profile of resource type
         * 'email', where the id is assigned to the email in place of a proper resource id
         *
         * @param  {String}     email           The email from which to create a standard resource profile
         * @param  {String}     role            The role of the resource in the members list
         * @return {Object}                     The standard resource member object required from the members list template
         */
        var createMemberProfileForEmail = function(email, role) {
            return {
                'resourceType': 'email',
                'id': email,
                'displayName': email,
                'role': role,
                'beenInvited': false
            };
        };


        ////////////////////////////
        //  RENDER / SHOW PANEL   //
        ////////////////////////////

        /**
         * Renders the visibility view.
         */
        var renderVisibility = function() {
            oae.api.util.template().render($('#setpermissions-visibility-template', $rootel), {
                'contextProfile': widgetData.contextProfile,
                'visibility': widgetData.visibility, 
                'resourceType': widgetData.type,
                'tenant': widgetData.oae.data.me.tenant.displayName
            }, $('#setpermissions-visibility', $rootel));
        };

        /**
         * Renders the share view.
         */
        var renderShare = function() {
            oae.api.util.template().render($('#setpermissions-share-template', $rootel), {
                'results': [widgetData.contextProfile],
                'defaultRole': widgetData.defaultRole,
                'roles': roles[widgetData.type]
            }, $('#setpermissions-share', $rootel));

            $('#setpermissions-savepermissions-share', $rootel).prop('disabled', true);

            setUpAutoSuggest();
        };

        /**
         * Shows a specified panel using the provided name.
         *
         * @param  {String}    panel    The name of the panel to show (i.e. 'visibility')
         */
        var showPanel = function(panel) {
            $('.modal-body > div').hide();
            $('.modal-footer').hide();

            if (widgetData.type === 'file') {
                $('#upload-permissions-container').show();
            } else {
                $('#create' + widgetData.type + '-permissions-container').show();
            }

            $('#' + uid + ' > div').hide();

            $('#setpermissions-' + panel + '-footer').show();
            $('#setpermissions-' + panel).show();
        };


        ////////////////////////////
        //      AUTO SUGGEST      //
        ////////////////////////////

        /**
         * Disable/enable the add button when an item has been added/removed from the autosuggest field.
         */
        var autoSuggestChanged = function() {
            $('#setpermissions-savepermissions-share', $rootel).prop('disabled', getAutosuggestSelection().length ? false : true);
        };

        /**
         * Initializes the autosuggest used for sharing with other users or groups.
         */
        var setUpAutoSuggest = function() {
            oae.api.util.autoSuggest().setup($('#setpermissions-share-autosuggest', $rootel), {
                'allowEmail': true,
                'exclude': widgetData.oae.data.me.id,
                'selectionChanged': autoSuggestChanged
            }, null, function() {
                // Focus on the autosuggest field once it has been set up
                focusAutoSuggest();
            });
        };

        /**
         * Focus on the autosuggest field used for sharing with other users or groups after the
         * autosuggest component has finished initializing and after the modal dialog has finished
         * loading.
         */
        var focusAutoSuggest = function() {
            // Only focus the autosuggest field when the share panel is showing
            if ($('#setpermissions-share', $rootel).is(':visible')) {
                oae.api.util.autoSuggest().focus($rootel);
            }
        };

        /**
         * Get the principals that were selected in the autosuggest field.
         *
         * @return {Object[]}               Trimmed member object as used by the members feed containing all properties necessary to render a list item in the infinite scroll
         */
        var getAutosuggestSelection = function() {
            // Convert these into an object that reflects the members feed, using a `profile` property
            // for the principal profile and a `role` property for the new role
            var selectedItems = [];
            $.each(oae.api.util.autoSuggest().getSelection($rootel), function(index, selectedItem) {
                // Autosuggest will provide the query that was used to find someone. If someone used
                // an email address to locate a user, we use it as criteria that indicates the user
                // performing the search can interact with that user, regardless of their profile
                // visibility or tenancy
                selectedItems.push({
                    'email': selectedItem.email,
                    'profile': _.omit(selectedItem, 'email'),
                    'role': $('#setpermissions-share-role', $rootel).val()
                });
            });

            return selectedItems;
        };


        ////////////////////////////
        // MEMBER INFINITE SCROLL //
        ////////////////////////////

        /**
         * Initialize a new infinite scroll container that fetches the members.
         */
        var renderMembers = function(folderMembers, callback) {
            // Disable the previous infinite scroll
            if (!_.isEmpty(infinityScroll)) {
                infinityScroll.kill();
            }
            
            var url = '/api/user/' + widgetData.oae.data.me.id;

            // Set up the infinite scroll instance
            infinityScroll = $('#setpermissions-overview-shared .oae-list').infiniteScroll(url, {
                'limit': 8
            }, '#setpermissions-overview-selected-template', {
                'scrollContainer': $('#setpermissions-overview-shared', $rootel),
                'postProcessor': function(principal) {
                    var data = {};

                    // Add the principal
                    data.results = [principal];

                    // Add the possible roles for the resource
                    data.roles = roles[widgetData.type];
                    data.displayOptions = {
                        'metadata': false
                    };

                    data.creator = widgetData.oae.data.me.id;

                    _.each(data.results, function(member) {
                        currentMembers[member.id] = member.role;
                    });

                    return data;
                },
                'postRenderer': function(data, $templateOutput) {
                    return callback();
                }
            });

            // Add the members of the folders if there is any
            _.each(folderMembers, function(member) {
                currentMembers[member.id] = member.role;
                infinityScroll.prependItems(member);
            });
        };


        //////////////////////
        // DEINITIALIZATION //
        //////////////////////

        /**
         * Resets the widget to its initial state
         */
        var reset = function() {

            // Reset the invitations and members caches
            currentMembers = {};
            currentInvitations = {};

            if (!_.isEmpty(infinityScroll)) {
                infinityScroll.kill();
                infinityScroll = {};
            }   

            $('#setpermissions-overview-invitations').hide();
        };


        ////////////////////////////
        //     INITIALIZATION     //
        ////////////////////////////

        /**
         * Inform the widget caller the initial permissions and members
         */
        var initSetPermissions = function() {
            var folder = '';
            var str = pageContext.id.split(':');

            if (str[0] === 'f') {
                folder = pageContext.id;
            } 

            $(document).trigger('oae.setpermissions.changed.' + uid, {
                'members': currentMembers,
                'selectedFolderItems': folder
            });
        };

        /**
         * Initialize the manage setpermissions widget
         */
        var setUpManageModal = function() {
            // Render the setpermissions template
            oae.api.util.template().render($('#setpermissions-manage-template', $rootel), widgetData, $('#setpermissions-manage', $rootel));
            
            // Generate a user-friendly summary
            var summary = oae.api.util.template().render($('#setpermissions-manage-template', $rootel), {
                'resourceType': widgetData.type,
                'visibility': widgetData.visibility,
                'tenantName': widgetData.oae.data.me.tenant.displayName
            });

            // Send the summary
            $(document).trigger('oae.setpermissions.changed.' + uid, {
                'summary': summary
            });

            // Trigger and bind an event that will ask for the page context
            $(document).on('oae.context.send.setpermissions.' + uid, function(ev, data) {
                pageContext = data;

                // If the resource is inside of a folder, get the folder members to add them to the resource
                getFolderMembers(pageContext.id, function(err, folderMembers) {
                    if (err) {
                        return err;
                    }
                    
                    renderMembers(folderMembers, initSetPermissions);
                });
            });

            // Delete a member from the list
            $(document).on('click', '.oae-listitem-actions .oae-listitem-remove', deleteMember);

            // Update a member's role in the list
            $(document).on('change', '.oae-listitem-actions select', updateRole);

            renderVisibility();

            setUpSetVisibilityModal();
            setUpShareModal();

            $('#setpermissions-overview-invitations').hide();

            // Reset the widget when it is dismissed.
            $('#create' + widgetData.type + '-modal').on('hidden.bs.modal', reset);
            $('#upload-modal').on('hidden.bs.modal', reset);
        };

        /**
         * Initialize the visibility setpermissions widget
         */
        var setUpSetVisibilityModal = function() {
            // Open the visibility modal
            $(document).on('click', '#setpermissions-change-visibility', function() {
                showPanel('visibility');
            });

            $('#setpermissions-savepermissions', $rootel).on('click', saveVisibilityChange);
            $('#setpermissions-cancelpermissions', $rootel).on('click', cancelPermissionsChange);

            $(document).trigger('oae.context.get', 'setpermissions.' + uid);

            // Catch changes in the visibility radio group
            $rootel.on('change', '.oae-large-options-container input[type="radio"]', function() {
                $('.oae-large-options-container label', $rootel).removeClass('checked');
                $(this).parents('label').addClass('checked');
            });
        };

        /**
         * Initialize the share setpermissions widget
         */
        var setUpShareModal = function() {
            // Open the add members modal
            $(document).on('click', '#setpermissions-share-add-more', function() {
                renderShare();
                showPanel('share');
            });

            $(document).on('click', '#setpermissions-savepermissions-share', saveMembersChange);
            $(document).on('click', '#setpermissions-cancelpermissions-share', cancelShareChange);
        };

        setUpManageModal();
    };
});
