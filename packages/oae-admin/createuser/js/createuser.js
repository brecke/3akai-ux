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

    return function(uid, showSettings) {

        // The widget container
        var $rootel = $('#' + uid);

        // Variable that keeps track of the current tenant context
        var currentContext = null;

        /**
         * Verify whether or not the entered username already exists as a login id on the current tenant.
         * The ajax request in this function executes synchronously to allow a username to be checked for
         * existence before the user is created.
         *
         * @param  {String}     username                The username we want to check the existence of
         * @param  {Function}   callback                Standard callback function
         * @param  {Boolean}    callback.available      Whether or not the username is available
         */
        var isUserNameAvailable = function(username, callback) {
            var url = '/api/auth/' + currentContext.alias + '/exists/' + username;
            // The tenant alias is not needed in the URL on a tenant server
            if (!currentContext.isGlobalAdminServer && !currentContext.isTenantOnGlobalAdminServer) {
                url = '/api/auth/exists/' + username;
            }
            $.ajax({
                url: url,
                async: false,
                success: function() {
                    // The username already exists
                    callback(false);
                },
                error: function(xhr, textStatus, thrownError) {
                    // The username is still available
                    callback(true);
                }
            });
        };

        /**
         * Set up the validation on the `create user` form, including the error messages
         */
        var setUpValidation = function() {
            var validateOpts = {
                'rules': {
                    'username': {
                        'minlength': 3,
                        'nospaces': true,
                        'validchars': true,
                        'usernameavailable': true
                    },
                    'password': {
                        'minlength': 6
                    },
                    'password_repeat': {
                        'equalTo': '#createuser-password'
                    }
                },
                'messages': {
                    'firstName': {
                        'required': oae.api.i18n.translate('__MSG__PLEASE_ENTER_FIRST_NAME__', 'createuser')
                    },
                    'lastName': {
                        'required': oae.api.i18n.translate('__MSG__PLEASE_ENTER_LAST_NAME__', 'createuser')
                    },
                    'email': {
                        'required': oae.api.i18n.translate('__MSG__PLEASE_ENTER_A_VALID_EMAIL_ADDRESS__'),
                        'email': oae.api.i18n.translate('__MSG__THIS_IS_AN_INVALID_EMAIL_ADDRESS__')
                    },
                    'username': {
                        'required': oae.api.i18n.translate('__MSG__PLEASE_ENTER_USERNAME__', 'createuser'),
                        'minlength': oae.api.i18n.translate('__MSG__THE_USERNAME_SHOULD_BE_AT_LEAST_THREE_CHARACTERS_LONG__'),
                        'nospaces': oae.api.i18n.translate('__MSG__THE_USERNAME_SHOULDNT_CONTAIN_SPACES__')
                    },
                    'password': {
                        'required': oae.api.i18n.translate('__MSG__PLEASE_ENTER_PASSWORD__', 'createuser'),
                        'minlength': oae.api.i18n.translate('__MSG__THE_PASSWORD_SHOULD_BE_AT_LEAST_SIX_CHARACTERS_LONG__')
                    },
                    'password_repeat': {
                        'required': oae.api.i18n.translate('__MSG__PLEASE_REPEAT_PASSWORD__', 'createuser'),
                        'passwordmatch': oae.api.i18n.translate('__MSG__THIS_PASSWORD_DOES_NOT_MATCH_THE_FIRST_ONE__')
                    }
                },
                'methods': {
                    'validchars': {
                        'method': function(value, element) {
                            return this.optional(element) || !(/[<>\\\/{}\[\]!#\$%\^&\*,:]+/i.test(value));
                        },
                        'text': oae.api.i18n.translate('__MSG__ACCOUNT_INVALIDCHAR__')
                    },
                    'usernameavailable': {
                        'method': function(value, element) {
                            var response = false;
                            isUserNameAvailable(value, function(available) {
                                response = available;
                                // Show the available icon if the username is available, otherwise show the unavailable icon
                                if (available) {
                                    $('#createuser-username-available', $rootel).removeClass('fa-times').addClass('fa-check');
                                } else {
                                    $('#createuser-username-available', $rootel).removeClass('fa-check').addClass('fa-times');
                                }
                            });
                            return response;
                        },
                        'text': oae.api.i18n.translate('__MSG__THIS_USERNAME_HAS_ALREADY_BEEN_TAKEN__')
                    }
                },
                'submitHandler': createUser
            };
            oae.api.util.validation().validate($('#createuser-form', $rootel), validateOpts);
        };

        /**
         * Create the new user. This will be called after validation has succeeded
         */
        var createUser = function() {
            // Get the form values
            var values = $('#createuser-form').serializeObject();

            // Disable the `create user` button during creation, so it can't be clicked multiple times
            $('button, input', $rootel).prop('disabled', true);

            // Create the user
            var displayName = values.firstName + ' ' + values.lastName;
            var email = values.email;

            // If we're creating a user from the global tenant specify the tenant to create the user on
            var tenantAlias = null;
            if (currentContext.isGlobalAdminServer || currentContext.isTenantOnGlobalAdminServer) {
                tenantAlias = currentContext.alias;
            }

            /**
             * Handle the result of creating a user
             *
             * @param  {Object}    [err]            Error object containing error code and error message
             * @param  {User}      [createdUser]    A User object representing the created user
             */
            var createUserHandler = function(err, createdUser) {
                if (err) {
                    // Unlock the `create user` button
                    $('button, input', $rootel).prop('disabled', false);
                    // Show an error notification
                    oae.api.util.notification(
                        oae.api.i18n.translate('__MSG__USER_NOT_CREATED__', 'createuser'),
                        oae.api.i18n.translate('__MSG__USER_CREATED_FAIL__', 'createuser'),
                        'error');
                } else {
                    // Hide the modal after creating the user
                    $('#createuser-modal', $rootel).modal('hide');
                    // Show a success notification
                    oae.api.util.notification(
                        oae.api.i18n.translate('__MSG__USER_CREATED__', 'createuser'),
                        oae.api.i18n.translate('__MSG__USER_CREATED_SUCCESS__', 'createuser'));
                    $(document).trigger('oae.createuser.done', createdUser);
                }
            };

            // If we're creating a user on the global tenant it will always be a global administrator
            if (currentContext.isGlobalAdminServer) {
                 oae.api.admin.createGlobalAdminUser(values.username, values.password, displayName, email, null, createUserHandler);
            // Create a tenant admin when the box is checked
            } else if ($('#createuser-tenantadmin', $rootel).is(':checked')) {
                oae.api.admin.createTenantAdminUser(tenantAlias, values.username, values.password, displayName, email, null, createUserHandler);
            // Create a regular user when the tenant admin box isn't checked and we're not on the global admin tenant
            } else {
                oae.api.admin.createUser(tenantAlias, values.username, values.password, displayName, email, null, createUserHandler);
            }
        };

        /**
         * Initialize the `create user` modal dialog
         */
        var initCreateUser = function() {
            $(document).on('oae.trigger.createuser', function(ev, data) {
                currentContext = data.context;
                // Trigger the modal dialog
                $('#createuser-modal', $rootel).modal({
                    'backdrop': 'static'
                });
                // Add the option of making the new user a tenant admin when looking at a user tenant
                if (!currentContext.isGlobalAdminServer) {
                    $('#createuser-tenantadmin-container', $rootel).show();
                }
            });

            $('#createuser-modal').on('hidden.bs.modal', function() {
                // Reset the form
                $('button, input', $rootel).prop('disabled', false);
                var $form = $('#createuser-form', $rootel);
                $form[0].reset();
                oae.api.util.validation().clear($form);
            });

            // Set focus to the first name field
            $('#createuser-modal', $rootel).on('shown.bs.modal', function () {
                $('#createuser-firstname', $rootel).focus();
            });
        };

        initCreateUser();
        setUpValidation();

    };
});
