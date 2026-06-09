import java.util.*;

class Solution {
    static List<Integer>[] tree;
    static int[] infoArr;
    static int answer = 0;

    public int solution(int[] info, int[][] edges) {
        infoArr = info;
        int total = info.length;
        tree = new ArrayList[total];

        for (int i = 0; i < total; i++) {
            tree[i] = new ArrayList<>();
        }

        // 인접리스트 만들기
        for (int[] edge : edges) {
            tree[edge[0]].add(edge[1]);
        }

        List<Integer> nextNodes = new ArrayList<>();
        nextNodes.add(0); // 0에서 출발
        dfs(0, 0, nextNodes);

        return answer;
    }

    private void dfs(int sheep, int wolf, List<Integer> candidates) {
        answer = Math.max(answer, sheep);
        for (int i = 0;i<candidates.size();i++) {
            // 인덱스로 접근
            int node = candidates.get(i);
            int nextSheep = sheep;
            int nextWolf = wolf;

            if (infoArr[node] == 0) nextSheep++;
            else nextWolf++;

            if (nextWolf >= nextSheep) continue;

            List<Integer> nextCandidates = new ArrayList<>(candidates);

            // 현재 방문한 노드 제거
            // 인덱스로 제거
            nextCandidates.remove(i);

            // 자식 노드 candidates에 추가
            nextCandidates.addAll(tree[node]);

            dfs(nextSheep, nextWolf, nextCandidates);
        }
    }
}