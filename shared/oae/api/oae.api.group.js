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

define(['exports', 'jquery', 'underscore', 'oae.api.util'], (exports, $, _, utilAPI) => {
  /**
   * Create a group
   *
   * @param  {String}            displayName              The displayName for this group
   * @param  {String}            [description]            The description for this group
   * @param  {String}            [visibility]             The visibility for this group
   * @param  {String}            [joinable]               Whether or not this group is joinable
   * @param  {String[]}          [managers]               An array of userIds that should be made managers
   * @param  {String[]}          [members]                An array of userIds that should be made members
   * @param  {Function}          [callback]               Standard callback function
   * @param  {Object}            [callback.err]           Error object containing error code and error message
   * @param  {Group}             [callback.group]         A Group object representing the created group
   * @throws {Error}                                      Error thrown when not all of the required parameters have been provided
   */
  var createGroup = (exports.createGroup = function(
    displayName,
    description,
    visibility,
    joinable,
    managers,
    members,
    callback
  ) {
    if (!displayName) {
      throw new Error('A group displayName should be provided');
    }

    // Set a default callback function in case no callback function has been provided
    callback = callback || function() {};

    let data = {
      displayName: displayName,
      description: description,
      visibility: visibility,
      joinable: joinable,
      managers: managers,
      members: members
    };

    $.ajax({
      url: '/api/group/create',
      type: 'POST',
      data: data,
      success: function(data) {
        callback(null, data);
      },
      error: function(jqXHR, textStatus) {
        callback({ code: jqXHR.status, msg: jqXHR.responseText });
      }
    });
  });

  /**
   * Get a group
   *
   * @param  {String}       groupId             The id of the group that should be retrieved
   * @param  {Function}     callback            Standard callback function
   * @param  {Object}       callback.err        Error object containing error code and error message
   * @param  {Group}        callback.group      The group object representing the requested group
   * @throws {Error}                            Error thrown when no group id has been provided
   */
  var getGroup = (exports.getGroup = function(groupId, callback) {
    if (!groupId) {
      throw new Error('A valid group id should be provided');
    }

    $.ajax({
      url: '/api/group/' + groupId,
      success: function(data) {
        callback(null, data);
      },
      error: function(jqXHR, textStatus) {
        callback({ code: jqXHR.status, msg: jqXHR.responseText });
      }
    });
  });

  /**
   * Update a group
   *
   * @param  {String}       groupId                         The id of the group that should be updated
   * @param  {Object}       profileFields                   Object where the keys represent the profile fields that need to be updated and the values represent the new values for those profile fields
   * @param  {String}       [profileFields.displayName]     New displayName for the group
   * @param  {String}       [profileFields.description]     New description for the group
   * @param  {String}       [profileFields.visibility]      New visibility setting for the group. The possible values are 'private', 'loggedin' and 'public'
   * @param  {String}       [profileFields.joinable]        New joinability setting for the group. The possible values are 'yes', 'no' and 'request'
   * @param  {Function}     [callback]                      Standard callback function
   * @param  {Object}       [callback.err]                  Error object containing error code and error message
   * @param  {Group}        [callback.group]                The group object representing the updated group
   * @throws {Error}                                        Error thrown when not all of the required parameters have been provided
   */
  var updateGroup = (exports.updateGroup = function(groupId, profileFields, callback) {
    if (!groupId) {
      throw new Error('A valid group id should be provided');
    } else if (!profileFields || _.keys(profileFields).length === 0) {
      throw new Error('At least one parameter should be provided');
    }

    // Set a default callback function in case no callback function has been provided
    callback = callback || function() {};

    // Only send those things that are truly supported.
    let data = _.pick(profileFields, 'displayName', 'description', 'visibility', 'joinable');

    $.ajax({
      url: '/api/group/' + groupId,
      type: 'POST',
      data: data,
      success: function(data) {
        callback(null, data);
      },
      error: function(jqXHR, textStatus) {
        callback({ code: jqXHR.status, msg: jqXHR.responseText });
      }
    });
  });

  /**
   * Get all the invitations for a group
   *
   * @param  {String}         groupId                         Id of the group we're trying to retrieve the invitations for
   * @param  {Function}       callback                        Standard callback function
   * @param  {Object}         callback.err                    Error object containing error code and error message
   * @param  {Object}         callback.invitations            Response object containing the group invitations
   * @param  {Invitation[]}   callback.invitations.results    Every invitation associated to the group
   * @throws {Error}                                          Error thrown when no group id has been provided
   */
  var getInvitations = (exports.getInvitations = function(groupId, callback) {
    if (!groupId) {
      throw new Error('A valid group id should be provided');
    }

    $.ajax({
      url: '/api/group/' + groupId + '/invitations',
      success: function(data) {
        callback(null, data);
      },
      error: function(jqXHR, textStatus) {
        callback({ code: jqXHR.status, msg: jqXHR.responseText });
      }
    });
  });

  /**
   * Resend an invitation that invites an email into a group
   *
   * @param  {String}     groupId         Id of the group whose invitation to resend
   * @param  {String}     email           The email of the invitation to resend
   * @param  {Function}   callback        Standard callback function
   * @param  {Object}     callback.err    Error object containing error code and error message
   * @throws {Error}                      Error thrown when no group id has been provided
   */
  var resendInvitation = (exports.resendInvitation = function(groupId, email, callback) {
    if (!groupId) {
      throw new Error('A valid group id should be provided');
    }

    $.ajax({
      url: '/api/group/' + groupId + '/invitations/' + email + '/resend',
      type: 'POST',
      success: function() {
        callback();
      },
      error: function(jqXHR, textStatus) {
        callback({ code: jqXHR.status, msg: jqXHR.responseText });
      }
    });
  });

  /**
   * Get the members of a group
   *
   * @param  {String}             groupId                        The id of the group you wish to update
   * @param  {String}             [start]                        The token used for paging. If the first page of results is required, `null` should be passed in as the token. For any subsequent pages, the `nextToken` provided in the feed from the previous page should be used
   * @param  {Number}             [limit]                        The number of members to retrieve
   * @param  {Function}           callback                       Standard callback function
   * @param  {Object}             callback.err                   Error object containing error code and error message
   * @param  {Object}             callback.members               Response object containing the group members and nextToken
   * @param  {User[]|Group[]}     callback.members.results       Array of principals representing the group members
   * @param  {String}             callback.members.nextToken     The value to provide in the `start` parameter to get the next set of results
   * @throws {Error}                                             Error thrown when no group id has been provided
   */
  var getMembers = (exports.getMembers = function(groupId, start, limit, callback) {
    if (!groupId) {
      throw new Error('A valid group id should be provided');
    }

    let data = {
      start: start,
      limit: limit
    };

    $.ajax({
      url: '/api/group/' + groupId + '/members',
      data: data,
      success: function(data) {
        callback(null, data);
      },
      error: function(jqXHR, textStatus) {
        callback({ code: jqXHR.status, msg: jqXHR.responseText });
      }
    });
  });

  /**
   * Update the members of a group
   *
   * @param  {String}       groupId             The id of the group you wish to update
   * @param  {Object}       members             A hash object where each key is the id of a user or group and the value is one of 'manager', 'member' or false. In case the value is false, the member will be deleted
   * @param  {Function}     [callback]          Standard callback function
   * @param  {Object}       [callback.err]      Error object containing error code and error message
   * @throws {Error}                            Error thrown when not all of the required parameters have been provided
   */
  var updateMembers = (exports.updateMembers = function(groupId, members, callback) {
    if (!groupId) {
      throw new Error('A valid group id should be provided');
    } else if (!members || _.keys(members).length === 0) {
      throw new Error('At least one member should be speficied.');
    }

    // Set a default callback function in case no callback function has been provided
    callback = callback || function() {};

    $.ajax({
      url: '/api/group/' + groupId + '/members',
      type: 'POST',
      data: members,
      success: function() {
        callback(null);
      },
      error: function(jqXHR, textStatus) {
        callback({ code: jqXHR.status, msg: jqXHR.responseText });
      }
    });
  });

  /**
   * Return all of the groups that a user is a direct and indirect member of
   *
   * @param  {String}       [userId]                           The user id for which we want to get all of the memberships. If this is not provided, the current user's id will be used
   * @param  {String}       [start]                            The token used for paging. If the first page of results is required, `null` should be passed in as the token. For any subsequent pages, the `nextToken` provided in the feed from the previous page should be used
   * @param  {Number}       [limit]                            The number of memberships to retrieve
   * @param  {Function}     callback                           Standard callback function
   * @param  {Object}       callback.err                       Error object containing error code and error message
   * @param  {Object}       callback.memberships               Response object containing the groups the provided user is a member of and nextToken
   * @param  {Group[]}      callback.memberships.results       An array of groups representing the direct and indirect memberships of the provided user
   * @param  {String}       callback.memberships.nextToken     The value to provide in the `start` parameter to get the next set of results
   * @throws {Error}                                           Error thrown when not all of the required parameters have been provided
   */
  var memberOf = (exports.memberOf = function(userId, start, limit, callback) {
    // Default values
    userId = userId || require('oae.core').data.me.id;
    limit = limit || 10;

    // Parameter validation
    if (!_.isNumber(limit)) {
      throw new TypeError('A valid limit should be provided');
    }

    $.ajax({
      url: '/api/user/' + userId + '/memberships',
      success: function(data) {
        callback(null, data);
      },
      error: function(jqXHR, textStatus) {
        callback({ code: jqXHR.status, msg: jqXHR.responseText });
      }
    });
  });

  /**
   * Join a group as the currently authenticated user
   *
   * @param  {String}       groupId             The id of the group that should be joined
   * @param  {Function}     [callback]          Standard callback function
   * @param  {Object}       [callback.err]      Error object containing error code and error message
   * @throws {Error}                            Error thrown when no groupid has been provided
   */
  var joinGroup = (exports.joinGroup = function(groupId, callback) {
    if (!groupId) {
      throw new Error('A valid group id should be provided');
    }

    // Set a default callback function in case no callback function has been provided
    callback = callback || function() {};

    $.ajax({
      url: '/api/group/' + groupId + '/join',
      type: 'POST',
      success: function(data) {
        callback(null, data);
      },
      error: function(jqXHR, textStatus) {
        callback({ code: jqXHR.status, msg: jqXHR.responseText });
      }
    });
  });

  /**
   * Leave a group as the currently authenticated user
   *
   * @param  {String}       groupId             The id of the group that should be left
   * @param  {Function}     [callback]          Standard callback function
   * @param  {Object}       [callback.err]      Error object containing error code and error message
   * @throws {Error}                            Error thrown when no group id has been provided
   */
  var leaveGroup = (exports.leaveGroup = function(groupId, callback) {
    if (!groupId) {
      throw new Error('A valid group id should be provided');
    }

    // Set a default callback function in case no callback function has been provided
    callback = callback || function() {};

    $.ajax({
      url: '/api/group/' + groupId + '/leave',
      type: 'POST',
      success: function(data) {
        callback(null, data);
      },
      error: function(jqXHR, textStatus) {
        callback({ code: jqXHR.status, msg: jqXHR.responseText });
      }
    });
  });

  /**
   * Delete a group
   *
   * @param  {String}     groupId             The id of the group to delete
   * @param  {Function}   [callback]          Standard callback function
   * @param  {Object}     [callback.err]      Error object containing the error code and error message
   * @throws {Error}                          Error thrown when no group id has been provided
   */
  var deleteGroup = (exports.deleteGroup = function(groupId, callback) {
    if (!groupId) {
      throw new Error('A valid group id should be provided');
    }

    // Set a default callback function in case no callback function has been provided
    callback = callback || function() {};

    $.ajax({
      url: '/api/group/' + groupId,
      type: 'DELETE',
      success: function(data) {
        callback();
      },
      error: function(jqXHR, textStatus) {
        callback({ code: jqXHR.status, msg: jqXHR.responseText });
      }
    });
  });

  /**
   * Create a request
   *
   * @param  {String}     groupId             The id of the group
   * @param  {Function}   [callback]          Standard callback function
   * @param  {Object}     [callback.err]      Error object containing the error code and error message
   * @throws {Error}                          Error thrown when no group id has been provided
   */
  let createRequestJoinGroup = (exports.createRequestJoinGroup = function(groupId, callback) {
    if (!groupId) {
      throw new Error('A valid group id should be provided');
    }

    // Set a default callback function in case no callback function has been provided
    callback = callback || function() {};

    $.ajax({
      url: '/api/group/' + groupId + '/join-request',
      type: 'POST',
      success() {
      callback();
    },
      error(jqXHR, textStatus) {
      callback({ code: jqXHR.status, msg: jqXHR.responseText });
    }
    });
  });

  /**
   * Cancel request made by the user
   *
   * @param  {String}     groupId             The id of the group
   * @param  {Function}   [callback]          Standard callback function
   * @param  {Object}     [callback.err]      Error object containing the error code and error message
   * @throws {Error}                          Error thrown when no group id has been provided
   */
  let cancelRequestJoinGroup = (exports.cancelRequestJoinGroup = function(groupId, callback) {
    if (!groupId) {
      throw new Error('A valid group id should be provided');
    }

    // Set a default callback function in case no callback function has been provided
    callback = callback || function() {};

    $.ajax({
      url: '/api/group/' + groupId + '/join-request',
      data: { status: 'cancel' },
      type: 'PUT',
      success() {
      callback();
    },
      error(jqXHR, textStatus) {
      callback({ code: jqXHR.status, msg: jqXHR.responseText });
    }
    });
  });

  /**
   * Accept a request
   *
   * @param  {String}     groupId             The id of the group
   * @param  {String}     principalId         The principal who wants to join the group
   * @param  {String}     role                The role asked by the principal who wants to join the group
   * @param  {Function}   [callback]          Standard callback function
   * @param  {Object}     [callback.err]      Error object containing the error code and error message
   * @throws {Error}                          Error thrown when no group id has been provided
   */
  let acceptJoinGroupByRequest = (exports.acceptJoinGroupByRequest = function(
    groupId,
    principalId,
    role,
    callback
  ) {
    if (!groupId) {
      throw new Error('A valid group id should be provided');
    } else if (!principalId) {
      throw new Error('A valid principal id should be provided');
    } else if (!role) {
      throw new Error('A valid role should be provided');
    }

    // Set a default callback function in case no callback function has been provided
    callback = callback || function() {};

    const data = {
      principalId,
      role,
      status: 'accept'
    };

    $.ajax({
      url: '/api/group/' + groupId + '/join-request',
      type: 'PUT',
      data,
      success() {
      callback();
    },
      error(jqXHR, textStatus) {
      callback({ code: jqXHR.status, msg: jqXHR.responseText });
    }
    });
  });

  /**
   * Reject a request
   *
   * @param  {String}     groupId             The id of the group
   * @param  {String}     principalId         The principal who wants to join the group
   * @param  {Function}   [callback]          Standard callback function
   * @param  {Object}     [callback.err]      Error object containing the error code and error message
   * @throws {Error}                          Error thrown when no group id has been provided
   */
  let rejectJoinGroupByRequest = (exports.rejectJoinGroupByRequest = function(
    groupId,
    principalId,
    callback
  ) {
    if (!groupId) {
      throw new Error('A valid group id should be provided');
    }
    if (!principalId) {
      throw new Error('A valid principal id should be provided');
    }

    // Set a default callback function in case no callback function has been provided
    callback = callback || function() {};

    const data = {
      principalId,
      status: 'reject'
    };

    $.ajax({
      url: '/api/group/' + groupId + '/join-request',
      type: 'PUT',
      data,
      success() {
      callback();
    },
      error(jqXHR, textStatus) {
      callback({ code: jqXHR.status, msg: jqXHR.responseText });
    }
    });
  });

  /**
   * Get all requests for a group
   *
   * @param  {String}     groupId             The id of the group
   * @param  {Function}   [callback]          Standard callback function
   * @param  {Object}     [callback.err]      Error object containing the error code and error message
   * @throws {Error}                          Error thrown when no group id has been provided
   */
  let getRequestsJoinGroup = (exports.getRequestsJoinGroup = function(groupId, callback) {
    if (!groupId) {
      throw new Error('A valid group id should be provided');
    }

    // Set a default callback function in case no callback function has been provided
    callback = callback || function() {};

    $.ajax({
      url: '/api/group/' + groupId + '/join-request/all',
      type: 'GET',
      success(requests) {
      callback(null, requests.results);
    },
      error(jqXHR, textStatus) {
      callback({ code: jqXHR.status, msg: jqXHR.responseText });
    }
    });
  });

  /**
   * Get the request done by a user on a group
   *
   * @param  {String}     groupId             The id of the group
   * @param  {Function}   [callback]          Standard callback function
   * @param  {Object}     [callback.err]      Error object containing the error code and error message
   * @throws {Error}                          Error thrown when no group id has been provided
   */
  let getRequestJoinGroup = (exports.getRequestJoinGroup = function(groupId, callback) {
    if (!groupId) {
      throw new Error('A valid group id should be provided');
    }

    // Set a default callback function in case no callback function has been provided
    callback = callback || function() {};

    $.ajax({
      url: '/api/group/' + groupId + '/join-request/mine',
      type: 'GET',
      success(request) {
      callback(null, request);
    },
      error(jqXHR, textStatus) {
      callback({ code: jqXHR.status, msg: jqXHR.responseText });
    }
    });
  });
});
