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
        $rootel = $('#' + uid);

        /**
         * Reset the widget to its original state when the modal is closed
         */
        var reset = function() {
            // Reset all the forms
            $('form', $rootel).each(function(i, form) {
                // Reset the form
                form.reset();
                // Clear the validation messages from the form
                oae.api.util.validation().clear(form);
            });

            // Deactivate all the tabs and tab panels
            $('#preferences-tab-container ul li', $rootel).removeClass('active');
            $('form', $rootel).removeClass('active');

            // Activate the first tab and its corresponding panel
            $('#preferences-tab-account', $rootel).addClass('active');
            $('#preferences-account', $rootel).addClass('active');
        };

        /**
         * Change the password of the currently authenticated user
         */
        var changePassword = function() {
            var oldPassword = $('#preferences-current-password', $rootel).val();
            var newPassword = $('#preferences-new-password', $rootel).val();

            oae.api.authentication.changePassword(oldPassword, newPassword, function(err) {
                if (err) {
                    if (err.code === 400) {
                        // The user has a non-local account
                        oae.api.util.notification(
                            oae.api.i18n.translate('__MSG__PASSWORD_NOT_UPDATED__'),
                            oae.api.i18n.translate('__MSG__YOUR_PASSWORD_CANNOT_BE_CHANGED_HERE__', 'preferences'),
                            'error'
                        );
                    } else if (err.code === 401) {
                        // The provided current password is incorrect
                        oae.api.util.notification(
                            oae.api.i18n.translate('__MSG__PASSWORD_NOT_UPDATED__'),
                            oae.api.i18n.translate('__MSG__THE_PROVIDED_PASSWORD_IS_INCORRECT__', 'preferences'),
                            'error'
                        );
                    } else {
                        // Show a generic failure notification
                        oae.api.util.notification(
                            oae.api.i18n.translate('__MSG__PASSWORD_NOT_UPDATED__'),
                            oae.api.i18n.translate('__MSG__YOUR_PASSWORD_UPDATE_FAILED__', 'preferences'),
                            'error'
                        );
                    }
                } else {
                    // Hide the modal after saving
                    $('#preferences-modal', $rootel).modal('hide');

                    // Show a success notification
                    oae.api.util.notification(
                        oae.api.i18n.translate('__MSG__PASSWORD_UPDATED__', 'preferences'),
                        oae.api.i18n.translate('__MSG__YOUR_PASSWORD_SUCCESSFULLY_UPDATED__', 'preferences')
                    );
                }
            });

            // Avoid default form submit behavior
            return false;
        };

        /**
         * Update the email and locale preferences
         */
        var updatePreferences = function() {
            var profile = {
                'locale': $('#preferences-language', $rootel).val(),
                'emailPreference': $('.oae-large-options-container input[type="radio"]:checked', $rootel).val()
            };

            oae.api.user.updateUser(profile, function(err) {
                if (err) {
                    // Show a failure notification
                    oae.api.util.notification(
                        oae.api.i18n.translate('__MSG__PREFERENCES_NOT_UPDATED__', 'preferences'),
                        oae.api.i18n.translate('__MSG__YOUR_PREFERENCES_UPDATE_FAILED__', 'preferences'),
                        'error'
                    );
                } else {
                    // Hide the modal after saving
                    $('#preferences-modal', $rootel).modal('hide');

                    // Show a success notification
                    oae.api.util.notification(
                        oae.api.i18n.translate('__MSG__PREFERENCES_UPDATED__', 'preferences'),
                        oae.api.i18n.translate('__MSG__YOUR_PREFERENCES_SUCCESSFULLY_UPDATED__', 'preferences')
                    );

                    // Cache the email preference
                    oae.data.me.emailPreference = profile.emailPreference;

                    // Reload the page if the language has been changed
                    if (profile.locale !== oae.data.me.locale) {
                        setTimeout(function() {
                            document.location.reload();
                        }, 2000);
                    }
                }
            });

            // Return false to avoid default form submit behavior
            return false;
        };

        /**
         * Set up validation for the `change password` form. This will validate and submit the form or
         * show an error message when appropriate.
         */
        setUpPasswordValidation = function() {
            oae.api.util.validation().validate($('#preferences-password', $rootel), {
                'rules': {
                    'preferences-new-password': {
                        'minlength': 6
                    },
                    'preferences-retype-password': {
                        'equalTo': '#preferences-new-password'
                    }
                },
                'messages': {
                    'preferences-new-password': {
                        'required': oae.api.i18n.translate('__MSG__PLEASE_ENTER_YOUR_PASSWORD__'),
                        'minlength': oae.api.i18n.translate('__MSG__YOUR_PASSWORD_SHOULD_BE_AT_LEAST_SIX_CHARACTERS_LONG__')
                    },
                    'preferences-retype-password': {
                        'required': oae.api.i18n.translate('__MSG__PLEASE_REPEAT_YOUR_PASSWORD__'),
                        'passwordmatch': oae.api.i18n.translate('__MSG__THIS_PASSWORD_DOES_NOT_MATCH_THE_FIRST_ONE__')
                    }
                },
                'submitHandler': changePassword
            });
        };

        /**
         * Render the email preferences and the list of available languages.
         * The i18n debug language will only be shown to administrators.
         */
        var setUpPreferences = function() {
            // Render the available languages
            oae.api.util.template().render($('#preferences-language-template', $rootel), null, $('#preferences-language', $rootel));

            // Render the email preferences
            oae.api.util.template().render($('#preferences-email-template', $rootel), null, $('#preferences-email-container', $rootel));
        };

        /**
         * Set up the preferences modal
         */
        var setUpPreferencesModal = function() {
            // Only show the password tab if the user logged in with the local authentication strategy
            if (oae.data.me.authenticationStrategy === 'local') {
                $('#preferences-tab-container', $rootel).show();
            }

            $(document).on('oae.trigger.preferences', function() {
                $('#preferences-modal', $rootel).modal({
                    'backdrop': 'static'
                });
                setUpPreferences();
            });

            $(document).on('click', '.oae-trigger-preferences', function() {
                $('#preferences-modal', $rootel).modal({
                    'backdrop': 'static'
                });
                setUpPreferences();
            });

            $('#preferences-modal', $rootel).on('hidden.bs.modal', reset);

            $rootel.on('change', '.oae-large-options-container input[type="radio"]', function() {
                $('.oae-large-options-container label', $rootel).removeClass('checked');
                $(this).parents('label').addClass('checked');
            });

            $rootel.on('submit', '#preferences-account', updatePreferences);
        };

        setUpPasswordValidation();
        setUpPreferencesModal();

    };
});
