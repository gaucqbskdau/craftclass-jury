// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint16, externalEuint16} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

/// @title FHECraftJury - Confidential Craft Workshop Scoring System
/// @author CraftClass Team
/// @notice Privacy-preserving evaluation system for leather/woodworking workshops
contract FHECraftJury is ZamaEthereumConfig {
    // ============ Enums ============
    
    enum Category { Leather, Wood, Mixed }
    enum AwardTier { None, Bronze, Silver, Gold }
    
    // ============ Structs ============
    
    struct Work {
        uint256 id;
        string title;
        Category category;
        uint256 groupId;
        uint256 timestamp;
        bool exists;
    }
    
    struct Score {
        euint16 craftsmanship; // 0-100
        euint16 detail;        // 0-100
        euint16 originality;   // 0-100
        uint256 timestamp;
        bool submitted;
    }
    
    struct GroupAggregate {
        euint16 avgCraftsmanship;
        euint16 avgDetail;
        euint16 avgOriginality;
        euint16 overallScore;
        uint256 judgeCount;
        bool aggregated;
    }
    
    struct Group {
        uint256 id;
        string name;
        uint256[] workIds;
        bool exists;
    }
    
    struct PublishedAward {
        uint16 score;
        AwardTier tier;
        bool published;
    }
    
    // ============ State Variables ============
    
    // Roles
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    
    mapping(address => bytes32) public userRoles;
    
    // Works
    mapping(uint256 => Work) public works;
    uint256 public workCount;
    
    // Groups
    mapping(uint256 => Group) public groups;
    uint256 public groupCount;
    
    // Scores: workId => judgeAddress => Score
    mapping(uint256 => mapping(address => Score)) public scores;
    
    // Track judges who scored each work
    mapping(uint256 => address[]) public workJudges;
    mapping(uint256 => mapping(address => bool)) public hasJudgeScored;
    
    // Group aggregates
    mapping(uint256 => GroupAggregate) public groupAggregates;
    
    // Published awards (decrypted)
    mapping(uint256 => PublishedAward) public publishedAwards;
    
    // Instructor authorizations: instructor => groupId => authorized
    mapping(address => mapping(uint256 => bool)) public instructorAuthorizations;
    mapping(address => mapping(uint256 => uint256)) public authorizationExpiry;
    
    // Award thresholds (encrypted)
    euint16 public goldThreshold;
    euint16 public silverThreshold;
    euint16 public bronzeThreshold;
    
    // Scoring deadline
    uint256 public scoringDeadline;
    
    // ============ Events ============
    
    event WorkRegistered(uint256 indexed workId, string title, Category category, uint256 groupId);
    event GroupCreated(uint256 indexed groupId, string name);
    event ScoreSubmitted(uint256 indexed workId, address indexed judge, uint256 timestamp);
    event GroupAggregated(uint256 indexed groupId, uint256 judgeCount);
    event AwardPublished(uint256 indexed groupId, uint16 score, AwardTier tier);
    event InstructorAuthorized(address indexed instructor, uint256 indexed groupId, uint256 expiry);
    event InstructorRevoked(address indexed instructor, uint256 indexed groupId);
    event RoleGranted(address indexed account, bytes32 role);
    event RoleRevoked(address indexed account, bytes32 role);
    
    // ============ Modifiers ============
    
    modifier onlyAdmin() {
        require(userRoles[msg.sender] == ADMIN_ROLE, "Not admin");
        _;
    }
    
    // ============ Constructor ============
    
    constructor() {
        userRoles[msg.sender] = ADMIN_ROLE;
        emit RoleGranted(msg.sender, ADMIN_ROLE);
        
        // Set default thresholds (will be encrypted)
        // These are placeholders; admin should set proper encrypted thresholds
        goldThreshold = FHE.asEuint16(85);
        silverThreshold = FHE.asEuint16(75);
        bronzeThreshold = FHE.asEuint16(65);
        
        FHE.allowThis(goldThreshold);
        FHE.allowThis(silverThreshold);
        FHE.allowThis(bronzeThreshold);
    }
    
    // ============ Role Management ============
    
    function grantRole(address account, bytes32 role) external onlyAdmin {
        require(role == ADMIN_ROLE, "Invalid role");
        userRoles[account] = role;
        emit RoleGranted(account, role);
    }
    
    function revokeRole(address account) external onlyAdmin {
        bytes32 oldRole = userRoles[account];
        delete userRoles[account];
        emit RoleRevoked(account, oldRole);
    }
    
    function hasRole(address account, bytes32 role) external view returns (bool) {
        return userRoles[account] == role;
    }
    
    // ============ Group Management ============
    
    function createGroup(string calldata name) external onlyAdmin returns (uint256) {
        uint256 groupId = groupCount++;
        groups[groupId] = Group({
            id: groupId,
            name: name,
            workIds: new uint256[](0),
            exists: true
        });
        emit GroupCreated(groupId, name);
        return groupId;
    }
    
    function getGroupWorkCount(uint256 groupId) external view returns (uint256) {
        require(groups[groupId].exists, "Group does not exist");
        return groups[groupId].workIds.length;
    }
    
    function getGroupWorkIds(uint256 groupId) external view returns (uint256[] memory) {
        require(groups[groupId].exists, "Group does not exist");
        return groups[groupId].workIds;
    }
    
    // ============ Work Management ============
    
    function registerWork(
        string calldata title,
        Category category,
        uint256 groupId
    ) external onlyAdmin returns (uint256) {
        require(groups[groupId].exists, "Group does not exist");
        
        uint256 workId = workCount++;
        works[workId] = Work({
            id: workId,
            title: title,
            category: category,
            groupId: groupId,
            timestamp: block.timestamp,
            exists: true
        });
        
        groups[groupId].workIds.push(workId);
        
        emit WorkRegistered(workId, title, category, groupId);
        return workId;
    }
    
    function assignWorkToGroup(uint256 workId, uint256 newGroupId) external onlyAdmin {
        require(works[workId].exists, "Work does not exist");
        require(groups[newGroupId].exists, "Group does not exist");
        
        uint256 oldGroupId = works[workId].groupId;
        
        // Remove from old group
        uint256[] storage oldWorkIds = groups[oldGroupId].workIds;
        for (uint256 i = 0; i < oldWorkIds.length; i++) {
            if (oldWorkIds[i] == workId) {
                oldWorkIds[i] = oldWorkIds[oldWorkIds.length - 1];
                oldWorkIds.pop();
                break;
            }
        }
        
        // Add to new group
        groups[newGroupId].workIds.push(workId);
        works[workId].groupId = newGroupId;
    }
    
    // ============ Scoring ============
    
    function submitScore(
        uint256 workId,
        externalEuint16 encCraftsmanship,
        externalEuint16 encDetail,
        externalEuint16 encOriginality,
        bytes calldata inputProof
    ) external {
        require(works[workId].exists, "Work does not exist");
        require(!hasJudgeScored[workId][msg.sender], "Already scored this work");
        
        // Convert external encrypted inputs to euint16
        euint16 craftsmanship = FHE.fromExternal(encCraftsmanship, inputProof);
        euint16 detail = FHE.fromExternal(encDetail, inputProof);
        euint16 originality = FHE.fromExternal(encOriginality, inputProof);
        
        // Store encrypted scores
        scores[workId][msg.sender] = Score({
            craftsmanship: craftsmanship,
            detail: detail,
            originality: originality,
            timestamp: block.timestamp,
            submitted: true
        });
        
        // Track judge
        workJudges[workId].push(msg.sender);
        hasJudgeScored[workId][msg.sender] = true;
        
        // Allow judge to decrypt their own scores
        FHE.allow(craftsmanship, msg.sender);
        FHE.allow(detail, msg.sender);
        FHE.allow(originality, msg.sender);
        
        // Allow contract to use scores for aggregation
        FHE.allowThis(craftsmanship);
        FHE.allowThis(detail);
        FHE.allowThis(originality);
        
        emit ScoreSubmitted(workId, msg.sender, block.timestamp);
    }
    
    function getWorkJudgeCount(uint256 workId) external view returns (uint256) {
        return workJudges[workId].length;
    }
    
    function hasJudgeScoredWork(uint256 workId, address judge) external view returns (bool) {
        return hasJudgeScored[workId][judge];
    }
    
    // ============ Aggregation ============
    
    function aggregateGroup(uint256 groupId) external onlyAdmin {
        require(groups[groupId].exists, "Group does not exist");
        require(!groupAggregates[groupId].aggregated, "Already aggregated");
        
        uint256[] memory workIds = groups[groupId].workIds;
        require(workIds.length > 0, "No works in group");
        
        euint16 sumCraftsmanship = FHE.asEuint16(0);
        euint16 sumDetail = FHE.asEuint16(0);
        euint16 sumOriginality = FHE.asEuint16(0);
        uint256 totalScores = 0;
        
        // Sum all scores in group
        for (uint256 i = 0; i < workIds.length; i++) {
            uint256 workId = workIds[i];
            address[] memory judges = workJudges[workId];
            
            for (uint256 j = 0; j < judges.length; j++) {
                Score storage score = scores[workId][judges[j]];
                if (score.submitted) {
                    sumCraftsmanship = FHE.add(sumCraftsmanship, score.craftsmanship);
                    sumDetail = FHE.add(sumDetail, score.detail);
                    sumOriginality = FHE.add(sumOriginality, score.originality);
                    totalScores++;
                }
            }
        }
        
        require(totalScores >= 3, "Minimum 3 scores required");
        
        // Note: FHE division requires plaintext divisor
        // For simplicity, we compute weighted sum and store it
        // Weights: Craftsmanship 40%, Detail 35%, Originality 25%
        // Instead of division, we multiply by weights and divide by plaintext
        
        // Average scores (divide by plaintext total)
        euint16 avgCrafts = FHE.div(sumCraftsmanship, uint16(totalScores));
        euint16 avgDetail = FHE.div(sumDetail, uint16(totalScores));
        euint16 avgOrigin = FHE.div(sumOriginality, uint16(totalScores));
        
        // Compute weighted overall: (avg * weight) / 100
        // We can't multiply encrypted by encrypted easily, so we scale weights
        // Use simple addition of weighted averages scaled by 100
        euint16 weightedSum = FHE.add(
            FHE.add(
                FHE.div(FHE.mul(avgCrafts, 40), 100),
                FHE.div(FHE.mul(avgDetail, 35), 100)
            ),
            FHE.div(FHE.mul(avgOrigin, 25), 100)
        );
        
        euint16 overallScore = weightedSum;
        
        // Store aggregates
        groupAggregates[groupId] = GroupAggregate({
            avgCraftsmanship: avgCrafts,
            avgDetail: avgDetail,
            avgOriginality: avgOrigin,
            overallScore: overallScore,
            judgeCount: totalScores,
            aggregated: true
        });
        
        // Allow contract to access for publishing
        FHE.allowThis(overallScore);
        FHE.allowThis(groupAggregates[groupId].avgCraftsmanship);
        FHE.allowThis(groupAggregates[groupId].avgDetail);
        FHE.allowThis(groupAggregates[groupId].avgOriginality);
        
        // Allow admin (msg.sender) to decrypt the results
        FHE.allow(overallScore, msg.sender);
        FHE.allow(groupAggregates[groupId].avgCraftsmanship, msg.sender);
        FHE.allow(groupAggregates[groupId].avgDetail, msg.sender);
        FHE.allow(groupAggregates[groupId].avgOriginality, msg.sender);
        
        emit GroupAggregated(groupId, totalScores);
    }
    
    // ============ Award Determination ============
    
    function determineAwardTier(euint16 score) internal view returns (AwardTier) {
        // Note: This is a simplified version. In production with FHEVM,
        // we'd use FHE.ge() comparisons and handle the ebool results.
        // For now, this will be handled in the publish flow with decryption.
        return AwardTier.None;
    }
    
    // ============ Publishing (Simplified - requires decryption oracle integration) ============
    
    /// @notice Simplified award publishing - stores decrypted score
    /// @dev In production, this would integrate with FHEVM decryption oracle
    function publishAward(uint256 groupId, uint16 decryptedScore) external onlyAdmin {
        require(groupAggregates[groupId].aggregated, "Group not aggregated");
        require(!publishedAwards[groupId].published, "Already published");
        
        AwardTier tier = AwardTier.None;
        if (decryptedScore >= 85) {
            tier = AwardTier.Gold;
        } else if (decryptedScore >= 75) {
            tier = AwardTier.Silver;
        } else if (decryptedScore >= 65) {
            tier = AwardTier.Bronze;
        }
        
        publishedAwards[groupId] = PublishedAward({
            score: decryptedScore,
            tier: tier,
            published: true
        });
        
        emit AwardPublished(groupId, decryptedScore, tier);
    }
    
    // ============ Instructor Authorization ============
    
    function authorizeInstructor(
        address instructor,
        uint256 groupId,
        uint256 expiryTimestamp
    ) external onlyAdmin {
        require(groups[groupId].exists, "Group does not exist");
        require(groupAggregates[groupId].aggregated, "Group not aggregated");
        require(expiryTimestamp > block.timestamp, "Invalid expiry");
        
        instructorAuthorizations[instructor][groupId] = true;
        authorizationExpiry[instructor][groupId] = expiryTimestamp;
        
        // Allow instructor to decrypt group aggregates
        FHE.allow(groupAggregates[groupId].overallScore, instructor);
        FHE.allow(groupAggregates[groupId].avgCraftsmanship, instructor);
        FHE.allow(groupAggregates[groupId].avgDetail, instructor);
        FHE.allow(groupAggregates[groupId].avgOriginality, instructor);
        
        emit InstructorAuthorized(instructor, groupId, expiryTimestamp);
    }
    
    function revokeInstructorAuthorization(address instructor, uint256 groupId) external onlyAdmin {
        instructorAuthorizations[instructor][groupId] = false;
        delete authorizationExpiry[instructor][groupId];
        emit InstructorRevoked(instructor, groupId);
    }
    
    function isInstructorAuthorized(address instructor, uint256 groupId) external view returns (bool) {
        if (!instructorAuthorizations[instructor][groupId]) {
            return false;
        }
        return block.timestamp < authorizationExpiry[instructor][groupId];
    }
    
    // ============ Admin Functions ============
    
    function setScoringDeadline(uint256 timestamp) external onlyAdmin {
        require(timestamp > block.timestamp, "Deadline must be in future");
        scoringDeadline = timestamp;
    }
    
    function setThresholds(
        externalEuint16 encGold,
        externalEuint16 encSilver,
        externalEuint16 encBronze,
        bytes calldata inputProof
    ) external onlyAdmin {
        goldThreshold = FHE.fromExternal(encGold, inputProof);
        silverThreshold = FHE.fromExternal(encSilver, inputProof);
        bronzeThreshold = FHE.fromExternal(encBronze, inputProof);
        
        FHE.allowThis(goldThreshold);
        FHE.allowThis(silverThreshold);
        FHE.allowThis(bronzeThreshold);
    }
    
    // ============ View Functions ============
    
    function getWork(uint256 workId) external view returns (Work memory) {
        require(works[workId].exists, "Work does not exist");
        return works[workId];
    }
    
    function getGroup(uint256 groupId) external view returns (Group memory) {
        require(groups[groupId].exists, "Group does not exist");
        return groups[groupId];
    }
    
    function getJudgeScore(uint256 workId, address judge) external view returns (
        euint16 craftsmanship,
        euint16 detail,
        euint16 originality,
        uint256 timestamp
    ) {
        Score storage score = scores[workId][judge];
        require(score.submitted, "Score not submitted");
        return (score.craftsmanship, score.detail, score.originality, score.timestamp);
    }
    
    function getGroupAggregate(uint256 groupId) external view returns (GroupAggregate memory) {
        require(groupAggregates[groupId].aggregated, "Group not aggregated");
        return groupAggregates[groupId];
    }
}

