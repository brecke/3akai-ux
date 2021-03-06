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

casper.test.begin('Widget - Manage user', function(test) {

    /**
     * Open the manage user modal with assertions
     *
     * @param  {User}    user    User profile object to test with
     */
    var openManageUser = function(user) {
        casper.waitForSelector('li[data-id="' + user.id + '"]', function() {
            test.assertExists('li[data-id="' + user.id + '"]', 'Manage user trigger exists');
            casper.click('li[data-id="' + user.id + '"]');
            casper.waitUntilVisible('#manageuser-modal', function() {
                test.assertVisible('#manageuser-modal', 'Manage user pane is showing after trigger');
            });
        });
    };

    /**
     * Verify all manage user elements on the profile tab are present
     */
    var verifyManageUserElementsProfile = function(user) {
        casper.echo('Verify profile tab elements', 'PARAMETER');
        test.assertExists('#manageuser-modal #manageuser-tab-container a[href="#manageuser-editprofile-form"]', 'Verify that the profile tab is present');
        casper.click('#manageuser-modal #manageuser-tab-container a[href="#manageuser-editprofile-form"]');
        test.assertExists('#manageuser-modal #manageuser-tab-container li.active a[href="#manageuser-editprofile-form"]', 'Verify that the profile tab is active after clicking the tab');
        test.assertExists('#manageuser-modal .tab-content #manageuser-editprofile-form.active', 'Verify that the profile pane is showing after clicking the tab');

        test.assertExists('#manageuser-modal #manageuser-editprofile-form.active .oae-thumbnail', 'Verify that the user\'s thumbnail is present');
        test.assertExists('#manageuser-modal #manageuser-editprofile-form.active label[for="manageuser-editprofile-name"]', 'Verify that \'Name\' label is present');
        test.assertSelectorHasText('#manageuser-modal #manageuser-editprofile-form.active label[for="manageuser-editprofile-name"] h4', 'Name', 'Verify that \'Name\' label has the correct title');
        test.assertExists('#manageuser-modal #manageuser-editprofile-form.active input#manageuser-editprofile-name', 'Verify that \'Name\' input field is present');
        test.assertEvalEquals(function() {
            return $('#manageuser-modal #manageuser-editprofile-form.active input#manageuser-editprofile-name').val();
        }, user.displayName, 'Verify that \'Name\' input field has the correct display name');
        test.assertExists('#manageuser-modal #manageuser-editprofile-form.active label[for="manageuser-editprofile-email"]', 'Verify that \'Email\' label is present');
        test.assertSelectorHasText('#manageuser-modal #manageuser-editprofile-form.active label[for="manageuser-editprofile-email"] h4', 'Email', 'Verify that \'Email\' label has the correct title');
        test.assertExists('#manageuser-modal #manageuser-editprofile-form.active input#manageuser-editprofile-email', 'Verify that \'Email\' input field is present');
        test.assertEvalEquals(function() {
            return $('#manageuser-modal #manageuser-editprofile-form.active input#manageuser-editprofile-email').val();
        }, user.email, 'Verify that \'Email\' input field has the correct email');

        test.assertSelectorHasText('#manageuser-modal #manageuser-editprofile-form.active h4', 'Profile visibility', 'Verify that \'Profile visibility\' label is present and has the correct title');
        test.assertExists('#manageuser-modal #manageuser-editprofile-form.active .oae-large-options-container', 'Verify that the privacy options container is present');
        test.assertExists('#manageuser-modal #manageuser-editprofile-form.active .oae-large-options-container label[for="oae-visibility-private"]', 'Verify that the \'private\' privacy option label is present');
        test.assertExists('#manageuser-modal #manageuser-editprofile-form.active .oae-large-options-container label[for="oae-visibility-private"] input[type="radio"]', 'Verify that the \'private\' privacy option radio button is present');
        test.assertExists('#manageuser-modal #manageuser-editprofile-form.active .oae-large-options-container label[for="oae-visibility-loggedin"]', 'Verify that the \'logged in\' privacy option label is present');
        test.assertExists('#manageuser-modal #manageuser-editprofile-form.active .oae-large-options-container label[for="oae-visibility-loggedin"] input[type="radio"]', 'Verify that the \'logged in\' privacy option radio button is present');
        test.assertExists('#manageuser-modal #manageuser-editprofile-form.active .oae-large-options-container label[for="oae-visibility-public"]', 'Verify that the \'public\' privacy option label is present');
        test.assertExists('#manageuser-modal #manageuser-editprofile-form.active .oae-large-options-container label[for="oae-visibility-public"] input[type="radio"]', 'Verify that the \'public\' privacy option radio button is present');
        test.assertExists('#manageuser-modal #manageuser-editprofile-form.active .oae-large-options-container label[for="oae-visibility-public"].checked', 'Verify that the \'public\' privacy option is checked');
        casper.click('#manageuser-modal #manageuser-editprofile-form.active .oae-large-options-container label[for="oae-visibility-private"] input[type="radio"]');
        test.assertDoesntExist('#manageuser-modal #manageuser-editprofile-form.active .oae-large-options-container label[for="oae-visibility-public"].checked', 'Verify that the \'public\' privacy option is unchecked after clicking a different privacy option');
        test.assertExists('#manageuser-modal #manageuser-editprofile-form.active .oae-large-options-container label[for="oae-visibility-private"].checked', 'Verify that the \'private\' privacy option is checked after clicking it');

        test.assertExists('#manageuser-modal #manageuser-editprofile-form.active .modal-footer button[data-dismiss="modal"]', 'Verify that the cancel button is present');
        test.assertExists('#manageuser-modal #manageuser-editprofile-form.active .modal-footer button[type="submit"]', 'Verify that the submit button is present');
    };

    /**
     * Verify all manage user elements on the email tab are present
     */
    var verifyManageUserElementsEmail = function() {
        casper.echo('Verify email tab elements', 'PARAMETER');
        test.assertExists('#manageuser-modal #manageuser-tab-container a[href="#manageuser-email-form"]', 'Verify that the email tab is present');
        casper.click('#manageuser-modal #manageuser-tab-container a[href="#manageuser-email-form"]');
        test.assertExists('#manageuser-modal #manageuser-tab-container li.active a[href="#manageuser-email-form"]', 'Verify that the email tab is active after clicking the tab');
        test.assertExists('#manageuser-modal .tab-content #manageuser-email-form.active', 'Verify that the email pane is showing after clicking the tab');

        test.assertSelectorHasText('#manageuser-modal #manageuser-email-form.active h4', 'Email notifications', 'Verify that \'Email notifications\' label is present and has the correct title');
        test.assertExists('#manageuser-modal #manageuser-email-form.active .oae-large-options-container', 'Verify that the email options container is present');
        test.assertExists('#manageuser-modal #manageuser-email-form.active .oae-large-options-container label[for="manageuser-email-immediate"]', 'Verify that the \'immediate\' email option label is present');
        test.assertExists('#manageuser-modal #manageuser-email-form.active .oae-large-options-container label[for="manageuser-email-immediate"] input[type="radio"]', 'Verify that the \'immediate\' email option radio button is present');
        test.assertExists('#manageuser-modal #manageuser-email-form.active .oae-large-options-container label[for="manageuser-email-daily"]', 'Verify that the \'daily\' email option label is present');
        test.assertExists('#manageuser-modal #manageuser-email-form.active .oae-large-options-container label[for="manageuser-email-daily"] input[type="radio"]', 'Verify that the \'daily\' email option radio button is present');
        test.assertExists('#manageuser-modal #manageuser-email-form.active .oae-large-options-container label[for="manageuser-email-weekly"]', 'Verify that the \'weekly\' email option label is present');
        test.assertExists('#manageuser-modal #manageuser-email-form.active .oae-large-options-container label[for="manageuser-email-weekly"] input[type="radio"]', 'Verify that the \'weekly\' email option radio button is present');
        test.assertExists('#manageuser-modal #manageuser-email-form.active .oae-large-options-container label[for="manageuser-email-immediate"].checked', 'Verify that the \'immediate\' email option is checked');
        casper.click('#manageuser-modal #manageuser-email-form.active .oae-large-options-container label[for="manageuser-email-weekly"] input[type="radio"]');
        test.assertDoesntExist('#manageuser-modal #manageuser-email-form.active .oae-large-options-container label[for="manageuser-email-immediate"].checked', 'Verify that the \'immediate\' email option is unchecked after clicking a different email option');
        test.assertExists('#manageuser-modal #manageuser-email-form.active .oae-large-options-container label[for="manageuser-email-weekly"].checked', 'Verify that the \'weekly\' email option is checked after clicking it');

        test.assertExists('#manageuser-modal #manageuser-email-form.active .modal-footer button[data-dismiss="modal"]', 'Verify that the cancel button is present');
        test.assertExists('#manageuser-modal #manageuser-email-form.active .modal-footer button[type="submit"]', 'Verify that the submit button is present');
    };

    /**
     * Verify all manage user elements on the actions tab are present
     *
     * @param  {User}    user    User profile object to test with
     */
    var verifyManageUserElementsActions = function(user) {
        casper.echo('Verify actions tab elements', 'PARAMETER');
        test.assertExists('#manageuser-modal #manageuser-tab-container a[href="#manageuser-actions-form"]', 'Verify that the actions tab is present');
        casper.click('#manageuser-modal #manageuser-tab-container a[href="#manageuser-actions-form"]');
        test.assertExists('#manageuser-modal #manageuser-tab-container li.active a[href="#manageuser-actions-form"]', 'Verify that the actions tab is active after clicking the tab');
        test.assertExists('#manageuser-modal .tab-content #manageuser-actions-form.active', 'Verify that the actions pane is showing after clicking the tab');

        test.assertSelectorHasText('#manageuser-modal #manageuser-actions-form.active h4', 'Become user', 'Verify that \'Become user\' label is present and has the correct title');
        test.assertExists('#manageuser-modal #manageuser-actions-form.active #manageuser-become-user', 'Verify that \'Become user\' button is present');
        test.assertSelectorHasText('#manageuser-modal #manageuser-actions-form.active #manageuser-become-user', 'Become ' + user.displayName, 'Verify that \'Become user\' button has the correct title');
        test.assertSelectorHasText('#manageuser-modal #manageuser-actions-form.active h4', 'Administration', 'Verify that \'Administration\' label is present and has the correct title');
        test.assertExists('#manageuser-modal #manageuser-actions-form.active input[type="checkbox"]#manageuser-privileges-isadmin', 'Verify that \'Tenant administrator\' checkbox is present');
        test.assertEvalEquals(function() {
            return $('#manageuser-modal #manageuser-actions-form.active input[type="checkbox"]#manageuser-privileges-isadmin').is(':checked');
        }, false, 'Verify that \'Tenant administrator\' checkbox is unchecked by default');

        test.assertExists('#manageuser-modal #manageuser-actions-form.active .modal-footer button[data-dismiss="modal"]', 'Verify that the cancel button is present');
        test.assertExists('#manageuser-modal #manageuser-actions-form.active .modal-footer button[type="submit"]', 'Verify that the submit button is present');
    };

    /**
     * Verify all manage user elements on the password tab are present
     */
    var verifyManageUserElementsPassword = function() {
        casper.echo('Verify password tab elements', 'PARAMETER');
        test.assertExists('#manageuser-modal #manageuser-tab-container a[href="#manageuser-password-form"]', 'Verify that the password tab is present');
        casper.click('#manageuser-modal #manageuser-tab-container a[href="#manageuser-password-form"]');
        test.assertExists('#manageuser-modal #manageuser-tab-container li.active a[href="#manageuser-password-form"]', 'Verify that the password tab is active after clicking the tab');
        test.assertExists('#manageuser-modal .tab-content #manageuser-password-form.active', 'Verify that the password pane is showing after clicking the tab');

        test.assertExists('#manageuser-modal .tab-content #manageuser-password-form label[for="manageuser-new-password"]', 'Verify that the \'New password\' label is present');
        test.assertSelectorHasText('#manageuser-modal .tab-content #manageuser-password-form label[for="manageuser-new-password"]', 'New password:', 'Verify that the \'New password\' label has the correct title');
        test.assertExists('#manageuser-modal .tab-content #manageuser-password-form input#manageuser-new-password', 'Verify that the \'New password\' input field is present');
        test.assertExists('#manageuser-modal .tab-content #manageuser-password-form label[for="manageuser-retype-password"]', 'Verify that the \'Re-type new password\' label is present');
        test.assertSelectorHasText('#manageuser-modal .tab-content #manageuser-password-form label[for="manageuser-retype-password"]', 'Re-type new password:', 'Verify that the \'Re-type new password\' label has the correct title');
        test.assertExists('#manageuser-modal .tab-content #manageuser-password-form input#manageuser-retype-password', 'Verify that the \'Re-type new password\' input field is present');

        test.assertExists('#manageuser-modal #manageuser-password-form.active .modal-footer button[data-dismiss="modal"]', 'Verify that the cancel button is present');
        test.assertExists('#manageuser-modal #manageuser-password-form.active .modal-footer button[type="submit"]', 'Verify that the submit button is present');
    };

    /**
     * Verify that all manage user elements specific to regular users are present
     *
     * @param  {User}    user    User profile object to test with
     */
    var verifyManageUserElementsForRegularuser = function(user) {
        casper.then(function() {
            verifyManageUserElementsProfile(user);
        });
        casper.then(verifyManageUserElementsEmail);
        casper.then(function() {
            verifyManageUserElementsActions(user);
        });
        casper.then(verifyManageUserElementsPassword);
    };

    /**
     * Verify that the user profile can be edited
     *
     * @param  {User}    user    User profile object to test with
     */
    var verifyEditProfile = function(user) {
        casper.click('#manageuser-modal #manageuser-tab-container a[href="#manageuser-editprofile-form"]');
        user.displayName = mainUtil.generateRandomString();
        user.email = mainUtil.generateRandomString() + '@example.com';
        casper.fill('#manageuser-modal #manageuser-editprofile-form', {
            'manageuser-editprofile-name': user.displayName,
            'manageuser-editprofile-email': user.email,
        }, false);
        casper.click('#manageuser-modal #manageuser-editprofile-form.active .oae-large-options-container input[value="private"]');
        casper.click('#manageuser-modal #manageuser-editprofile-form.active .modal-footer button[type="submit"]');
        casper.waitForSelector('#oae-notification-container .alert', function() {
            test.assertDoesntExist('#oae-notification-container .alert.alert-error', 'Verify that the profile can be successfully edited');
            casper.click('#oae-notification-container .close');
            casper.wait(configUtil.modalWaitTime, function() {
                openManageUser(user);
            });

            casper.then(function() {
                test.assertEvalEquals(function() {
                    return $('#manageuser-modal #manageuser-editprofile-form.active input#manageuser-editprofile-name').val();
                }, user.displayName, 'Verify that \'Name\' input field has the updated display name');
                test.assertEvalEquals(function() {
                    return $('#manageuser-modal #manageuser-editprofile-form.active input#manageuser-editprofile-email').val();
                }, user.email, 'Verify that \'Email\' input field has the updated email');
                test.assertExists('#manageuser-modal #manageuser-editprofile-form.active .oae-large-options-container label[for="oae-visibility-private"].checked', 'Verify that the \'private\' privacy option is checked after updating the profile');
            });
        });
    };

    /**
     * Verify that the email settings can be edited
     *
     * @param  {User}    user    User profile object to test with
     */
    var verifyEditEmail = function(user) {
        casper.click('#manageuser-modal #manageuser-tab-container a[href="#manageuser-email-form"]');
        casper.click('#manageuser-modal #manageuser-email-form.active .oae-large-options-container input[value="weekly"]');
        casper.click('#manageuser-modal #manageuser-email-form.active .modal-footer button[type="submit"]');
        casper.waitForSelector('#oae-notification-container .alert', function() {
            test.assertDoesntExist('#oae-notification-container .alert.alert-error', 'Verify that the email settings can be successfully edited');
            casper.click('#oae-notification-container .close');
            casper.wait(configUtil.modalWaitTime, function() {
                openManageUser(user);
            });
            casper.then(function() {
                casper.click('#manageuser-modal #manageuser-tab-container a[href="#manageuser-email-form"]');
                test.assertExists('#manageuser-modal #manageuser-email-form.active .oae-large-options-container label[for="manageuser-email-weekly"].checked', 'Verify that the \'weekly\' email option is checked after updating the email preferences');
                user.emailPreference = 'weekly';
            });
        });
    };

    /**
     * Verify that the actions can be edited
     *
     * @param  {User}    user    User profile object to test with
     */
    var verifyEditActions = function(user) {
        casper.click('#manageuser-modal #manageuser-tab-container a[href="#manageuser-actions-form"]');
        casper.click('#manageuser-modal #manageuser-actions-form.active #manageuser-become-user');
        casper.waitForSelector('#me-clip-container h1', function() {
            test.assertSelectorHasText('#me-clip-container h1', user.displayName, 'Verify that an administrator can become a user');
            userUtil.doLogOut();
            uiUtil.openAdminUserManagement(configUtil.tenantAlias, user.displayName);
            casper.then(function() {
                openManageUser(user);
            });
            casper.then(function() {
                casper.click('#manageuser-modal #manageuser-tab-container a[href="#manageuser-actions-form"]');
                casper.click('#manageuser-modal #manageuser-actions-form.active input[type="checkbox"]#manageuser-privileges-isadmin');
                casper.click('#manageuser-modal #manageuser-actions-form.active .modal-footer button[type="submit"]');
                casper.waitForSelector('#oae-notification-container .alert', function() {
                    test.assertDoesntExist('#oae-notification-container .alert.alert-error', 'Verify that the actions settings can be successfully edited');
                    casper.click('#oae-notification-container .close');
                    casper.wait(configUtil.modalWaitTime, function() {
                        openManageUser(user);
                    });
                    casper.then(function() {
                        casper.click('#manageuser-modal #manageuser-tab-container a[href="#manageuser-actions-form"]');
                        test.assertEvalEquals(function() {
                            return $('#manageuser-modal #manageuser-actions-form.active input[type="checkbox"]#manageuser-privileges-isadmin').is(':checked');
                        }, true, 'Verify that \'Tenant administrator\' checkbox is checked after submitting the form');
                        casper.waitForSelector('#manageuser-modal #manageuser-modal-title .badge', function() {
                            test.assertExists('#manageuser-modal #manageuser-modal-title .badge', 'Verify that the \'Administrator\' badge is now shown next to the modal title');
                            test.assertSelectorHasText('#manageuser-modal #manageuser-modal-title .badge', 'Administrator', 'Verify that the \'Administrator\' badge has the correct text');
                        });
                    });
                });
            });
        });
    };

    /**
     * Verify that the password can be edited
     */
    var verifyEditPassword = function() {
        casper.click('#manageuser-modal #manageuser-tab-container a[href="#manageuser-password-form"]');
        var password = mainUtil.generateRandomString();
        casper.fill('#manageuser-modal #manageuser-password-form', {
            'manageuser-new-password': password,
            'manageuser-retype-password': password
        }, false);
        casper.click('#manageuser-modal #manageuser-password-form.active .modal-footer button[type="submit"]');
        casper.waitForSelector('#oae-notification-container .alert', function() {
            test.assertDoesntExist('#oae-notification-container .alert.alert-error', 'Verify that the password can be successfully edited');
            casper.click('#oae-notification-container .close');
        });
    };

    casper.start(configUtil.tenantUI, function() {

        // Create a user to test with
        userUtil.createUsers(1, function(user1) {
            uiUtil.openAdmin();
            userUtil.doLogIn(configUtil.adminUsername, configUtil.adminPassword);
            uiUtil.openAdminUserManagement(configUtil.tenantAlias, user1.displayName);

            casper.then(function() {
                casper.echo('# Verify open manage user modal', 'INFO');
                openManageUser(user1);
            });

            casper.then(function() {
                casper.echo('# Verify manage user elements', 'INFO');
                verifyManageUserElementsForRegularuser(user1);
            });

            casper.then(function() {
                casper.echo('# Verify updating the user profile', 'INFO');
                verifyEditProfile(user1);
            });

            casper.then(function() {
                casper.echo('# Verify updating the email settings', 'INFO');
                verifyEditEmail(user1);
            });

            casper.then(function() {
                casper.echo('# Verify updating the actions settings', 'INFO');
                verifyEditActions(user1);
            });

            casper.then(function() {
                casper.echo('# Verify updating the password', 'INFO');
                verifyEditPassword();
            });

            userUtil.doLogOut();

        });
    });

    casper.run(function() {
        test.done();
    });
});
